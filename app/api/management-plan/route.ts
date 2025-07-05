import { NextRequest, NextResponse } from 'next/server';
import { AzureChatOpenAI } from '@langchain/openai';
import { Patient, ClinicalDecision, DoseCalculation } from '../../types/medical';
import { RAGService } from '../../lib/rag-service';
import { DoseCalculator, DoseCalculationRequest } from '../../lib/dose-calculator';
import { getGuidelineLink } from '../../lib/guideline-links';
import {
  PATIENT_EXTRACTION_PROMPT,
  PATIENT_EXTRACTION_SYSTEM_PROMPT,
  CONDITION_ASSESSMENT_PROMPT,
  CONDITION_ASSESSMENT_SYSTEM_PROMPT,
  MEDICATION_RECOMMENDATIONS_PROMPT,
  MEDICATION_RECOMMENDATIONS_SYSTEM_PROMPT,
  MANAGEMENT_PLAN_PROMPT,
  MANAGEMENT_PLAN_SYSTEM_PROMPT
} from '../../prompts';

// Helper function to process medication recommendations with dose calculator
async function processMedicationRecommendations(
  rawRecommendations: any[],
  patient: Patient,
  condition: string,
  severity: 'mild' | 'moderate' | 'severe'
): Promise<DoseCalculation[]> {
  const processedRecommendations: DoseCalculation[] = [];

  for (const rawRec of rawRecommendations) {
    try {
      // Extract dosing parameters from the raw recommendation
      const doseRequest: DoseCalculationRequest = {
        medication: rawRec.medication,
        weight: patient.weight,
        weightUnit: 'kg',
        dose: rawRec.dose || 0,
        doseUnit: rawRec.unit || 'mg',
        maxDose: rawRec.maxDose,
        maxDoseUnit: rawRec.maxDoseUnit,
        frequency: rawRec.frequency,
        route: rawRec.route,
        patientAge: patient.age * 12, // Convert years to months
        patientWeight: patient.weight,
        condition: condition
      };

      // Validate the request
      const validationErrors = DoseCalculator.validateRequest(doseRequest);
      if (validationErrors.length > 0) {
        console.warn(`Skipping medication ${rawRec.medication}: ${validationErrors.join(', ')}`);
        continue;
      }

      // Calculate the dose using the calculator
      const calculatedResult = DoseCalculator.calculateDose(doseRequest);

      // Create the final recommendation
      const processedRec: DoseCalculation = {
        medication: calculatedResult.medication,
        dose: calculatedResult.calculatedDose,
        unit: calculatedResult.unit,
        frequency: calculatedResult.frequency,
        route: calculatedResult.route,
        rationale: calculatedResult.rationale,
        evidenceLevel: calculatedResult.evidenceLevel,
        confidence: calculatedResult.confidence,
        safetyChecks: calculatedResult.safetyChecks,
        patientWeight: calculatedResult.patientWeight,
        patientAge: calculatedResult.patientAge,
        calculatedDose: calculatedResult.calculatedDose,
        doseRange: calculatedResult.doseRange,
        warnings: calculatedResult.warnings
      };

      processedRecommendations.push(processedRec);
    } catch (error) {
      console.error(`Error processing medication ${rawRec.medication}:`, error);
      // Continue with other medications
    }
  }

  return processedRecommendations;
}

// Helper function to get initial guidelines without severity
async function getInitialGuidelines(
  patient: Patient,
  condition: string,
  presentingComplaint: string
): Promise<any> {
  try {
    // Import the necessary functions
    const { generateEmbedding } = await import('../../lib/embeddings');
    const { searchTherapeuticGuidelines } = await import('../../lib/database');
    
    // Create a broader search query to get relevant guidelines
    const searchQuery = `${condition} treatment guidelines clinical assessment severity criteria`;
    const queryEmbedding = await generateEmbedding(searchQuery);
    const guidelines = await searchTherapeuticGuidelines(queryEmbedding, 15);
    
    // Transform guidelines to match RAGGuidelineChunk format
    const transformedChunks = guidelines.map((guideline: any) => ({
      id: guideline.id,
      content: guideline.content,
      metadata: {
        ...guideline.metadata,
        title: guideline.metadata?.header4 || guideline.metadata?.header3 || guideline.metadata?.header1 || 'Unknown',
        section: guideline.metadata?.header4 || guideline.metadata?.header3 || 'Unknown',
        evidenceLevel: 'Unknown',
        version: 'Unknown',
        date: 'Unknown'
      }
    }));

    return {
      retrievedChunks: guidelines,
      filteredChunks: transformedChunks.slice(0, 10), // Get top 10 most relevant
      synthesis: {
        synthesis: `Retrieved ${transformedChunks.length} relevant guidelines for ${condition}`,
        conflicts: [],
        consensus: 'Guidelines retrieved for condition assessment',
        patientSpecific: 'Guidelines will be used for severity determination',
        finalRecommendations: 'Use guidelines to assess severity criteria'
      }
    };
  } catch (error) {
    console.error('Error getting initial guidelines:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Transcript is required and must be a string' },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('AZURE_OPENAI_API_KEY is not set');
    }
    if (!process.env.AZURE_OPENAI_ENDPOINT) {
      throw new Error('AZURE_OPENAI_ENDPOINT is not set');
    }
    if (!process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
      throw new Error('AZURE_OPENAI_DEPLOYMENT_NAME is not set');
    }
    
    // Extract instance name from endpoint
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    let instanceName = endpoint.replace('https://', '').replace('.openai.azure.com/', '');
    
    // If the endpoint contains .cognitiveservices.azure.com, extract just the resource name
    if (instanceName.includes('.cognitiveservices.azure.com')) {
      instanceName = instanceName.replace('.cognitiveservices.azure.com', '');
    }

    // Initialize Azure OpenAI model
    const model = new AzureChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: instanceName,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      temperature: 0.3, // Lower temperature for more consistent medical recommendations
    });

    // Step 1: Extract patient data from transcript
    console.log('Step 1: Extracting patient data from transcript...');
    const patientExtractionPrompt = PATIENT_EXTRACTION_PROMPT.replace('{transcript}', transcript);

    const patientResponse = await model.invoke([
      ['system', PATIENT_EXTRACTION_SYSTEM_PROMPT],
      ['human', patientExtractionPrompt]
    ]);

    let patient: Patient;
    try {
      let content = patientResponse.content as string;
      
      if (content.includes('```json')) {
        // Extract content between ```json and ```
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        } else {
          // Fallback: remove ```json and ``` markers
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
      } else if (content.includes('```')) {
        // Extract content between ``` markers
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          content = codeMatch[1];
        } else {
          // Fallback: remove ``` markers
          content = content.replace(/```\n?/g, '');
        }
      }
      
      content = content.trim();
      patient = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse patient data:', patientResponse.content);
      console.error('Parse error:', parseError);
      throw new Error('Failed to extract patient data from transcript');
    }

    // Step 2: Determine condition (without severity initially)
    console.log('Step 2: Determining primary condition...');
    const conditionPrompt = CONDITION_ASSESSMENT_PROMPT
      .replace('{patientInfo}', JSON.stringify(patient))
      .replace('{transcript}', transcript);

    const conditionResponse = await model.invoke([
      ['system', CONDITION_ASSESSMENT_SYSTEM_PROMPT],
      ['human', conditionPrompt]
    ]);

    let conditionData: { condition: string; severity: 'mild' | 'moderate' | 'severe'; confidence: number };
    try {
      let content = conditionResponse.content as string;
      
      if (content.includes('```json')) {
        // Extract content between ```json and ```
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        } else {
          // Fallback: remove ```json and ``` markers
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
      } else if (content.includes('```')) {
        // Extract content between ``` markers
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          content = codeMatch[1];
        } else {
          // Fallback: remove ``` markers
          content = content.replace(/```\n?/g, '');
        }
      }
      
      content = content.trim();
      conditionData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse condition data:', conditionResponse.content);
      console.error('Parse error:', parseError);
      throw new Error('Failed to determine condition and severity');
    }

    // Step 3: Get initial guidelines based on condition (before severity assessment)
    console.log('Step 3: Retrieving initial guidelines based on condition...');
    let initialGuidelines = null;
    let ragService: RAGService | null = null;
    
    try {
      ragService = new RAGService();
      initialGuidelines = await getInitialGuidelines(
        patient,
        conditionData.condition,
        patient.presentingComplaint
      );
    } catch (ragError) {
      console.error('Initial RAG processing failed, continuing without guidelines:', ragError);
    }

    // Step 4: Re-assess severity using guidelines for more accurate determination
    console.log('Step 4: Re-assessing severity using clinical guidelines...');
    const enhancedConditionPrompt = `
Based on the patient information, transcript, and relevant clinical guidelines, determine the primary condition and severity with enhanced accuracy.

Patient Info: {patientInfo}
Transcript: {transcript}
Relevant Guidelines: {guidelines}

Consider the clinical criteria and severity indicators from the guidelines when determining severity.

Return a JSON object with:
- condition: string (primary diagnosis)
- severity: "mild", "moderate", or "severe" (based on guideline criteria)
- confidence: number (0-100)
- reasoning: string (explanation of severity determination based on guidelines)

Return ONLY the JSON object, no additional text.
`.replace('{patientInfo}', JSON.stringify(patient))
  .replace('{transcript}', transcript)
  .replace('{guidelines}', initialGuidelines ? JSON.stringify(initialGuidelines.filteredChunks.slice(0, 5)) : 'No guidelines available');

    const enhancedConditionResponse = await model.invoke([
      ['system', CONDITION_ASSESSMENT_SYSTEM_PROMPT],
      ['human', enhancedConditionPrompt]
    ]);

    let enhancedConditionData: { condition: string; severity: 'mild' | 'moderate' | 'severe'; confidence: number; reasoning?: string };
    try {
      let content = enhancedConditionResponse.content as string;
      
      if (content.includes('```json')) {
        // Extract content between ```json and ```
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        } else {
          // Fallback: remove ```json and ``` markers
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
      } else if (content.includes('```')) {
        // Extract content between ``` markers
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          content = codeMatch[1];
        } else {
          // Fallback: remove ``` markers
          content = content.replace(/```\n?/g, '');
        }
      }
      
      content = content.trim();
      enhancedConditionData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse enhanced condition data:', enhancedConditionResponse.content);
      console.error('Parse error:', parseError);
      // Fall back to original condition data
      enhancedConditionData = conditionData;
    }

    // Step 5: Process refined RAG with determined severity
    console.log('Step 5: Retrieving refined guidelines with determined severity...');
    let ragResult = null;
    let essentialRAGInfo = null;
    try {
      if (ragService) {
        ragResult = await ragService.processRAG(
          patient,
          enhancedConditionData.condition,
          enhancedConditionData.severity,
          patient.presentingComplaint,
          10 // Increased limit for comprehensive guidelines
        );
        // Get only essential information (summary + highly relevant chunks)
        essentialRAGInfo = ragService.getEssentialRAGInfo(ragResult, 0.7);
      }
    } catch (ragError) {
      console.error('Refined RAG processing failed, continuing without guidelines:', ragError);
      // Continue without RAG results
    }

    console.log(essentialRAGInfo?.highlyRelevantChunks.length);

    // Step 6: Generate comprehensive management plan based on guidelines
    console.log('Step 6: Generating management plan...');
    const managementPrompt = MANAGEMENT_PLAN_PROMPT
      .replace('{patientInfo}', JSON.stringify(patient))
      .replace('{condition}', enhancedConditionData.condition)
      .replace('{severity}', enhancedConditionData.severity)
      .replace('{medications}', '[]') // No medications yet, will be calculated in next step
      .replace('{guidelines}', essentialRAGInfo ? JSON.stringify(essentialRAGInfo.highlyRelevantChunks) : 'No specific guidelines available')
      .replace('{guidelineSummary}', essentialRAGInfo ? JSON.stringify(essentialRAGInfo.summary) : 'No guideline summary available');

    const managementResponse = await model.invoke([
      ['system', MANAGEMENT_PLAN_SYSTEM_PROMPT],
      ['human', managementPrompt]
    ]);

    // Step 7: Generate medication recommendations and calculate precise doses
    console.log('Step 7: Generating medication recommendations and calculating doses...');
    const medicationPrompt = MEDICATION_RECOMMENDATIONS_PROMPT
      .replace('{patientInfo}', JSON.stringify(patient))
      .replace('{condition}', enhancedConditionData.condition)
      .replace('{severity}', enhancedConditionData.severity)
      .replace('{guidelines}', essentialRAGInfo ? JSON.stringify(essentialRAGInfo.highlyRelevantChunks) : 'No specific guidelines available')
      .replace('{guidelineSummary}', essentialRAGInfo ? JSON.stringify(essentialRAGInfo.summary) : 'No guideline summary available')
      .replace('{managementPlan}', managementResponse.content as string);

    const medicationResponse = await model.invoke([
      ['system', MEDICATION_RECOMMENDATIONS_SYSTEM_PROMPT],
      ['human', medicationPrompt]
    ]);

    let rawMedicationRecommendations: any[] = [];
    try {
      let content = medicationResponse.content as string;
      
      if (content.includes('```json')) {
        // Extract content between ```json and ```
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        } else {
          // Fallback: remove ```json and ``` markers
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
      } else if (content.includes('```')) {
        // Extract content between ``` markers
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          content = codeMatch[1];
        } else {
          // Fallback: remove ``` markers
          content = content.replace(/```\n?/g, '');
        }
      }
      
      content = content.trim();
      rawMedicationRecommendations = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse medication data:', medicationResponse.content);
      console.error('Parse error:', parseError);
      // Continue without medication recommendations
    }

    // Process medication recommendations with dose calculator
    const medicationRecommendations = await processMedicationRecommendations(
      rawMedicationRecommendations,
      patient,
      enhancedConditionData.condition,
      enhancedConditionData.severity
    );

    // Step 8: Calculate overall confidence
    const overallConfidence = Math.round(
      (enhancedConditionData.confidence + 
       (medicationRecommendations.length > 0 ? 
         medicationRecommendations.reduce((sum, med) => sum + med.confidence, 0) / medicationRecommendations.length : 
         0)) / 2
    );

    // Group guidelines by source and find the most relevant chunk from each source
    const guidelinesBySource = new Map<string, any[]>();
    const relevantGuidelines = essentialRAGInfo ? essentialRAGInfo.highlyRelevantChunks : [];
    relevantGuidelines.forEach((guideline: any) => {
      const source = guideline.metadata.source;
      if (!guidelinesBySource.has(source)) {
        guidelinesBySource.set(source, []);
      }
      guidelinesBySource.get(source)!.push(guideline);
    });

    // Find the most relevant chunk from each source
    const bestChunksBySource = Array.from(guidelinesBySource.entries()).map(([source, chunks]) => {
      return chunks.reduce((best, current) => {
        const currentScore = current.relevanceScore || 0;
        const bestScore = best.relevanceScore || 0;
        return currentScore > bestScore ? current : best;
      });
    });

    // Find the single most relevant guideline across all sources
    const mostRelevantGuideline = bestChunksBySource.length > 0 
      ? bestChunksBySource.reduce((mostRelevant, current) => {
          const currentScore = current.relevanceScore || 0;
          const mostRelevantScore = mostRelevant.relevanceScore || 0;
          return currentScore > mostRelevantScore ? current : mostRelevant;
        })
      : null;

    // Add guideline link to the most relevant guideline
    const guidelinesWithLinks = mostRelevantGuideline ? [{
      ...mostRelevantGuideline,
      metadata: {
        ...mostRelevantGuideline.metadata,
        guidelineLink: getGuidelineLink(mostRelevantGuideline.metadata.source),
        isMostRelevant: true,
        relevanceScore: mostRelevantGuideline.relevanceScore || 0
      }
    }] : [];

    // Construct the final result
    const result: ClinicalDecision = {
      patient,
      condition: enhancedConditionData.condition,
      severity: enhancedConditionData.severity,
      relevantGuidelines: guidelinesWithLinks,
      medicationRecommendations,
      managementPlan: managementResponse.content as string,
      confidence: overallConfidence,
      evidenceSummary: essentialRAGInfo 
        ? `Based on clinical assessment of ${enhancedConditionData.condition} with ${enhancedConditionData.severity} severity, supported by ${essentialRAGInfo.highlyRelevantChunks.length} highly relevant therapeutic guidelines. ${enhancedConditionData.reasoning ? `Severity determination reasoning: ${enhancedConditionData.reasoning}` : ''}`
        : `Based on clinical assessment of ${enhancedConditionData.condition} with ${enhancedConditionData.severity} severity.`,
      warnings: medicationRecommendations.flatMap(med => med.warnings || []),
      timestamp: new Date()
    };

    // Include RAG results in the response
    const responseData: any = {
      success: true,
      result,
      timestamp: new Date().toISOString()
    };

    // Add RAG information if available
    if (ragResult) {
      responseData.ragInfo = {
        retrievedChunks: ragResult.retrievedChunks.length,
        filteredChunks: ragResult.filteredChunks.length,
        synthesis: ragResult.synthesis,
        finalRecommendation: ragResult.finalRecommendation,
        retrievalMetrics: ragResult.retrievalMetrics
      };
    }

    // Add information about the enhanced severity assessment
    if (enhancedConditionData.reasoning) {
      responseData.severityAssessment = {
        originalSeverity: conditionData.severity,
        enhancedSeverity: enhancedConditionData.severity,
        reasoning: enhancedConditionData.reasoning,
        guidelinesUsed: initialGuidelines ? initialGuidelines.filteredChunks.length : 0
      };
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Management Plan API Error:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate management plan',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Management Plan API is running. Send a POST request with a transcript to generate a clinical decision.',
    status: 'ready'
  });
} 