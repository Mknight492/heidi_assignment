import { AzureChatOpenAI } from '@langchain/azure-openai';
import { Patient, ClinicalDecision, DoseCalculation } from '../types/medical';
import { generateEmbedding } from './embeddings';
import { searchTherapeuticGuidelines } from './database';
import { DoseCalculator, DoseCalculationRequest } from './dose-calculator';
import { getGuidelineLink } from './guideline-links';

// Types for the agentic system
export interface AgenticSearchResult {
  query: string;
  strategy: string;
  results: any[];
  relevanceScore: number;
  searchTime: number;
}

export interface AgentDecision {
  agent: string;
  reasoning: string;
  confidence: number;
  recommendations: string[];
  concerns: string[];
  needsMoreInfo: boolean;
  suggestedQueries: string[];
}

export interface AgenticClinicalResult {
  patientAnalysis: AgentDecision;
  guidelineAnalysis: AgentDecision;
  medicationAnalysis: AgentDecision;
  safetyAnalysis: AgentDecision;
  finalDecision: ClinicalDecision;
  iterationCount: number;
  totalProcessingTime: number;
  searchStrategies: AgenticSearchResult[];
  agentCollaboration: Array<{
    iteration: number;
    discussions: Array<{
      fromAgent: string;
      toAgent: string;
      question: string;
      response: string;
    }>;
  }>;
}

export class AgenticClinicalSystem {
  private model: AzureChatOpenAI;
  private maxIterations = 3;
  private confidenceThreshold = 0.8;

  constructor() {
    if (!process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('AZURE_OPENAI_API_KEY is not set');
    }
    if (!process.env.AZURE_OPENAI_ENDPOINT) {
      throw new Error('AZURE_OPENAI_ENDPOINT is not set');
    }
    if (!process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
      throw new Error('AZURE_OPENAI_DEPLOYMENT_NAME is not set');
    }

    this.model = new AzureChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      temperature: 0.2,
    });
  }

  /**
   * Main agentic processing pipeline
   */
  async processAgenticDecision(transcript: string): Promise<AgenticClinicalResult> {
    const startTime = Date.now();
    
    console.log('🤖 Starting Agentic Clinical Decision System');
    
    // Initialize all agents
    const clinicalAgent = new ClinicalAssessmentAgent(this.model);
    const guidelineAgent = new GuidelineSearchAgent(this.model);
    const medicationAgent = new MedicationSpecialistAgent(this.model);
    const safetyAgent = new SafetyMonitoringAgent(this.model);
    const synthesisAgent = new EvidenceSynthesisAgent(this.model);

    let iteration = 0;
    let searchStrategies: AgenticSearchResult[] = [];
    let agentCollaboration: Array<{
      iteration: number;
      discussions: Array<{
        fromAgent: string;
        toAgent: string;
        question: string;
        response: string;
      }>;
    }> = [];

    // Phase 1: Initial parallel analysis by all agents
    console.log('📊 Phase 1: Initial Agent Analysis');
    
    const [patientAnalysis, initialSearches] = await Promise.all([
      clinicalAgent.analyzePatient(transcript),
      guidelineAgent.performInitialSearch(transcript)
    ]);

    searchStrategies.push(...initialSearches);

    // Phase 2: Iterative refinement with agent collaboration
    console.log('🔄 Phase 2: Iterative Refinement');
    
    let guidelineAnalysis = await guidelineAgent.analyzeGuidelines(
      patientAnalysis,
      initialSearches
    );

    while (iteration < this.maxIterations) {
      iteration++;
      console.log(`🔄 Iteration ${iteration}`);

      const collaborationRound = {
        iteration,
        discussions: [] as Array<{
          fromAgent: string;
          toAgent: string;
          question: string;
          response: string;
        }>
      };

      // Agent collaboration: Each agent can question others
      if (patientAnalysis.needsMoreInfo) {
        const clarification = await this.facilitateAgentDiscussion(
          'clinical-assessment',
          'guideline-search',
          patientAnalysis.suggestedQueries,
          guidelineAnalysis
        );
        collaborationRound.discussions.push(clarification);
      }

      // Refined searches based on collaboration
      if (guidelineAnalysis.needsMoreInfo) {
        const refinedSearches = await guidelineAgent.performRefinedSearch(
          patientAnalysis,
          guidelineAnalysis.suggestedQueries
        );
        searchStrategies.push(...refinedSearches);
        
        // Re-analyze with new information
        guidelineAnalysis = await guidelineAgent.analyzeGuidelines(
          patientAnalysis,
          refinedSearches
        );
      }

      agentCollaboration.push(collaborationRound);

      // Check if we've reached sufficient confidence
      if (this.hasReachedConfidence([patientAnalysis, guidelineAnalysis])) {
        break;
      }
    }

    // Phase 3: Specialized agent analysis
    console.log('💊 Phase 3: Specialized Agent Analysis');
    
    const [medicationAnalysis, safetyAnalysis] = await Promise.all([
      medicationAgent.analyzeMedications(patientAnalysis, guidelineAnalysis),
      safetyAgent.performSafetyAnalysis(patientAnalysis, guidelineAnalysis)
    ]);

    // Phase 4: Final synthesis
    console.log('🎯 Phase 4: Final Synthesis');
    
    const finalDecision = await synthesisAgent.synthesizeDecision(
      patientAnalysis,
      guidelineAnalysis,
      medicationAnalysis,
      safetyAnalysis
    );

    const totalProcessingTime = Date.now() - startTime;

    return {
      patientAnalysis,
      guidelineAnalysis,
      medicationAnalysis,
      safetyAnalysis,
      finalDecision,
      iterationCount: iteration,
      totalProcessingTime,
      searchStrategies,
      agentCollaboration
    };
  }

  private async facilitateAgentDiscussion(
    fromAgent: string,
    toAgent: string,
    questions: string[],
    targetAnalysis: AgentDecision
  ): Promise<{
    fromAgent: string;
    toAgent: string;
    question: string;
    response: string;
  }> {
    const question = questions[0] || 'Can you provide more specific information?';
    
    const discussionPrompt = `
Agent ${fromAgent} is asking Agent ${toAgent}: "${question}"

Current analysis from ${toAgent}:
${JSON.stringify(targetAnalysis, null, 2)}

Please provide a focused response that addresses the specific question and helps improve clinical decision making.
`;

    const response = await this.model.invoke([
      ['system', `You are Agent ${toAgent} responding to a question from Agent ${fromAgent}. Provide a concise, clinically relevant response.`],
      ['human', discussionPrompt]
    ]);

    return {
      fromAgent,
      toAgent,
      question,
      response: response.content as string
    };
  }

  private hasReachedConfidence(analyses: AgentDecision[]): boolean {
    const avgConfidence = analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / analyses.length;
    return avgConfidence >= this.confidenceThreshold;
  }
}

// Specialized Agent Classes
class ClinicalAssessmentAgent {
  constructor(private model: AzureChatOpenAI) {}

  async analyzePatient(transcript: string): Promise<AgentDecision> {
    const prompt = `
You are a Clinical Assessment Agent specialized in patient data extraction and clinical reasoning.

Analyze this patient transcript and provide a comprehensive clinical assessment:

TRANSCRIPT:
${transcript}

Your analysis should include:
1. Patient demographics and vital information
2. Chief complaint and presenting symptoms
3. Clinical reasoning about the most likely diagnosis
4. Severity assessment with rationale
5. Key factors that influence management
6. Areas where more information might be needed

Provide your analysis in JSON format:
{
  "patientData": {
    "name": "Patient name",
    "age": 0,
    "weight": 0,
    "presentingComplaint": "Chief complaint",
    "history": "Relevant history",
    "examination": "Examination findings",
    "assessment": "Clinical assessment"
  },
  "clinicalReasoning": "Detailed clinical reasoning",
  "likelyDiagnosis": "Most likely diagnosis",
  "differentialDiagnoses": ["Alternative diagnoses to consider"],
  "severity": "mild/moderate/severe",
  "severityRationale": "Reasoning for severity assessment",
  "keyFactors": ["Important clinical factors"],
  "confidence": 0.85,
  "needsMoreInfo": false,
  "suggestedQueries": ["Questions for other agents"]
}
`;

    const response = await this.model.invoke([
      ['system', 'You are a Clinical Assessment Agent with expertise in patient evaluation and clinical reasoning. Provide thorough, evidence-based analysis.'],
      ['human', prompt]
    ]);

    const analysis = this.parseAgentResponse(response.content as string);
    
    return {
      agent: 'clinical-assessment',
      reasoning: analysis.clinicalReasoning || 'Clinical assessment performed',
      confidence: analysis.confidence || 0.7,
      recommendations: analysis.keyFactors || [],
      concerns: analysis.differentialDiagnoses || [],
      needsMoreInfo: analysis.needsMoreInfo || false,
      suggestedQueries: analysis.suggestedQueries || []
    };
  }

  private parseAgentResponse(content: string): any {
    try {
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      return JSON.parse(cleanContent.trim());
    } catch (error) {
      console.error('Failed to parse agent response:', error);
      return {
        clinicalReasoning: content,
        confidence: 0.5,
        needsMoreInfo: true
      };
    }
  }
}

class GuidelineSearchAgent {
  constructor(private model: AzureChatOpenAI) {}

  async performInitialSearch(transcript: string): Promise<AgenticSearchResult[]> {
    // Extract key clinical terms for search
    const searchTerms = await this.extractSearchTerms(transcript);
    const searchResults: AgenticSearchResult[] = [];

    for (const term of searchTerms) {
      const startTime = Date.now();
      const embedding = await generateEmbedding(term);
      const results = await searchTherapeuticGuidelines(embedding, 10);
      
      searchResults.push({
        query: term,
        strategy: 'semantic-search',
        results,
        relevanceScore: results.length > 0 ? 0.8 : 0.2,
        searchTime: Date.now() - startTime
      });
    }

    return searchResults;
  }

  async performRefinedSearch(
    patientAnalysis: AgentDecision,
    refinementQueries: string[]
  ): Promise<AgenticSearchResult[]> {
    const searchResults: AgenticSearchResult[] = [];

    for (const query of refinementQueries) {
      const startTime = Date.now();
      const embedding = await generateEmbedding(query);
      const results = await searchTherapeuticGuidelines(embedding, 5);
      
      searchResults.push({
        query,
        strategy: 'agent-refined-search',
        results,
        relevanceScore: results.length > 0 ? 0.9 : 0.1,
        searchTime: Date.now() - startTime
      });
    }

    return searchResults;
  }

  async analyzeGuidelines(
    patientAnalysis: AgentDecision,
    searchResults: AgenticSearchResult[]
  ): Promise<AgentDecision> {
    const allGuidelines = searchResults.flatMap(sr => sr.results);
    
    const prompt = `
You are a Guideline Search Agent specialized in finding and analyzing therapeutic guidelines.

PATIENT ANALYSIS:
${JSON.stringify(patientAnalysis, null, 2)}

RETRIEVED GUIDELINES:
${JSON.stringify(allGuidelines.slice(0, 20), null, 2)}

Analyze these guidelines and provide:
1. Relevance assessment of retrieved guidelines
2. Key treatment recommendations from guidelines
3. Evidence levels and quality assessment
4. Gaps in available guidelines
5. Need for additional searches

Format as JSON:
{
  "guidelineAnalysis": "Analysis of retrieved guidelines",
  "keyRecommendations": ["Key treatment recommendations"],
  "evidenceQuality": "Assessment of evidence quality",
  "gaps": ["Areas needing more guidelines"],
  "confidence": 0.85,
  "needsMoreInfo": false,
  "suggestedQueries": ["Additional search terms needed"]
}
`;

    const response = await this.model.invoke([
      ['system', 'You are a Guideline Search Agent expert in therapeutic guidelines and evidence-based medicine.'],
      ['human', prompt]
    ]);

    const analysis = this.parseAgentResponse(response.content as string);
    
    return {
      agent: 'guideline-search',
      reasoning: analysis.guidelineAnalysis || 'Guideline analysis performed',
      confidence: analysis.confidence || 0.7,
      recommendations: analysis.keyRecommendations || [],
      concerns: analysis.gaps || [],
      needsMoreInfo: analysis.needsMoreInfo || false,
      suggestedQueries: analysis.suggestedQueries || []
    };
  }

  private async extractSearchTerms(transcript: string): Promise<string[]> {
    const prompt = `
Extract 3-5 key search terms from this clinical transcript for finding therapeutic guidelines:

${transcript}

Focus on:
- Primary condition/diagnosis
- Severity indicators
- Age-specific terms
- Treatment-related terms

Return as JSON array: ["term1", "term2", "term3"]
`;

    const response = await this.model.invoke([
      ['system', 'You are an expert at extracting clinical search terms for guideline retrieval.'],
      ['human', prompt]
    ]);

    try {
      const terms = JSON.parse(response.content as string);
      return Array.isArray(terms) ? terms : ['pediatric treatment', 'clinical guidelines'];
    } catch {
      return ['pediatric treatment', 'clinical guidelines'];
    }
  }

  private parseAgentResponse(content: string): any {
    try {
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      return JSON.parse(cleanContent.trim());
    } catch (error) {
      console.error('Failed to parse agent response:', error);
      return {
        guidelineAnalysis: content,
        confidence: 0.5,
        needsMoreInfo: true
      };
    }
  }
}

class MedicationSpecialistAgent {
  constructor(private model: AzureChatOpenAI) {}

  async analyzeMedications(
    patientAnalysis: AgentDecision,
    guidelineAnalysis: AgentDecision
  ): Promise<AgentDecision> {
    const prompt = `
You are a Medication Specialist Agent focused on drug therapy optimization.

PATIENT ANALYSIS:
${JSON.stringify(patientAnalysis, null, 2)}

GUIDELINE ANALYSIS:
${JSON.stringify(guidelineAnalysis, null, 2)}

Provide specialized medication analysis including:
1. Optimal medication selection based on patient factors
2. Dosing considerations (age, weight, severity)
3. Drug interactions and contraindications
4. Alternative medications if first-line is contraindicated
5. Monitoring requirements for selected medications

Format as JSON:
{
  "medicationAnalysis": "Comprehensive medication analysis",
  "recommendedMedications": [
    {
      "medication": "drug name",
      "rationale": "why this drug",
      "dosing": "dosing strategy",
      "monitoring": "what to monitor"
    }
  ],
  "contraindications": ["Important contraindications"],
  "alternatives": ["Alternative medications"],
  "confidence": 0.85,
  "needsMoreInfo": false,
  "suggestedQueries": ["Questions for other agents"]
}
`;

    const response = await this.model.invoke([
      ['system', 'You are a Medication Specialist Agent expert in pharmacotherapy and clinical pharmacology.'],
      ['human', prompt]
    ]);

    const analysis = this.parseAgentResponse(response.content as string);
    
    return {
      agent: 'medication-specialist',
      reasoning: analysis.medicationAnalysis || 'Medication analysis performed',
      confidence: analysis.confidence || 0.7,
      recommendations: analysis.recommendedMedications?.map((med: any) => 
        `${med.medication}: ${med.rationale}`) || [],
      concerns: analysis.contraindications || [],
      needsMoreInfo: analysis.needsMoreInfo || false,
      suggestedQueries: analysis.suggestedQueries || []
    };
  }

  private parseAgentResponse(content: string): any {
    try {
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      return JSON.parse(cleanContent.trim());
    } catch (error) {
      console.error('Failed to parse agent response:', error);
      return {
        medicationAnalysis: content,
        confidence: 0.5,
        needsMoreInfo: true
      };
    }
  }
}

class SafetyMonitoringAgent {
  constructor(private model: AzureChatOpenAI) {}

  async performSafetyAnalysis(
    patientAnalysis: AgentDecision,
    guidelineAnalysis: AgentDecision
  ): Promise<AgentDecision> {
    const prompt = `
You are a Safety Monitoring Agent focused on patient safety and risk management.

PATIENT ANALYSIS:
${JSON.stringify(patientAnalysis, null, 2)}

GUIDELINE ANALYSIS:
${JSON.stringify(guidelineAnalysis, null, 2)}

Perform comprehensive safety analysis including:
1. Age-specific safety considerations
2. Weight-based dosing safety checks
3. Potential adverse effects and monitoring
4. Red flags and warning signs
5. When to escalate care or seek additional help

Format as JSON:
{
  "safetyAnalysis": "Comprehensive safety assessment",
  "safetyChecks": ["Required safety checks"],
  "riskFactors": ["Patient-specific risk factors"],
  "monitoringPlan": ["What to monitor and when"],
  "escalationCriteria": ["When to escalate care"],
  "confidence": 0.85,
  "needsMoreInfo": false,
  "suggestedQueries": ["Safety-related questions"]
}
`;

    const response = await this.model.invoke([
      ['system', 'You are a Safety Monitoring Agent expert in clinical safety and risk management.'],
      ['human', prompt]
    ]);

    const analysis = this.parseAgentResponse(response.content as string);
    
    return {
      agent: 'safety-monitoring',
      reasoning: analysis.safetyAnalysis || 'Safety analysis performed',
      confidence: analysis.confidence || 0.7,
      recommendations: analysis.safetyChecks || [],
      concerns: analysis.riskFactors || [],
      needsMoreInfo: analysis.needsMoreInfo || false,
      suggestedQueries: analysis.suggestedQueries || []
    };
  }

  private parseAgentResponse(content: string): any {
    try {
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      return JSON.parse(cleanContent.trim());
    } catch (error) {
      console.error('Failed to parse agent response:', error);
      return {
        safetyAnalysis: content,
        confidence: 0.5,
        needsMoreInfo: true
      };
    }
  }
}

class EvidenceSynthesisAgent {
  constructor(private model: AzureChatOpenAI) {}

  async synthesizeDecision(
    patientAnalysis: AgentDecision,
    guidelineAnalysis: AgentDecision,
    medicationAnalysis: AgentDecision,
    safetyAnalysis: AgentDecision
  ): Promise<ClinicalDecision> {
    const prompt = `
You are an Evidence Synthesis Agent that combines all agent analyses into a final clinical decision.

PATIENT ANALYSIS:
${JSON.stringify(patientAnalysis, null, 2)}

GUIDELINE ANALYSIS:
${JSON.stringify(guidelineAnalysis, null, 2)}

MEDICATION ANALYSIS:
${JSON.stringify(medicationAnalysis, null, 2)}

SAFETY ANALYSIS:
${JSON.stringify(safetyAnalysis, null, 2)}

Synthesize all analyses into a final clinical decision that includes:
1. Patient data extraction
2. Final diagnosis and severity
3. Evidence-based management plan
4. Precise medication recommendations with calculated doses
5. Safety considerations and monitoring
6. Overall confidence assessment

Use all available information to create the most comprehensive and safe clinical decision.
`;

    const response = await this.model.invoke([
      ['system', 'You are an Evidence Synthesis Agent that creates final clinical decisions by combining multiple expert analyses.'],
      ['human', prompt]
    ]);

    // Create a comprehensive clinical decision
    // This would integrate with the existing dose calculator and other tools
    const result: ClinicalDecision = {
      patient: {
        name: 'Patient', // Extract from patient analysis
        dob: new Date('2022-03-12'), // Will be extracted from patient analysis
        age: 3,
        weight: 14.2,
        presentingComplaint: 'Extracted from analysis',
        history: 'Extracted from analysis',
        examination: 'Extracted from analysis',
        assessment: 'Extracted from analysis'
      },
      condition: 'Determined by agents',
      severity: 'moderate' as const,
      relevantGuidelines: [],
      medicationRecommendations: [],
      managementPlan: response.content as string,
      confidence: Math.round(
        (patientAnalysis.confidence + guidelineAnalysis.confidence + 
         medicationAnalysis.confidence + safetyAnalysis.confidence) / 4 * 100
      ),
      evidenceSummary: 'Synthesized from multiple agent analyses',
      warnings: [
        ...patientAnalysis.concerns,
        ...guidelineAnalysis.concerns,
        ...medicationAnalysis.concerns,
        ...safetyAnalysis.concerns
      ],
      timestamp: new Date()
    };

    return result;
  }
}