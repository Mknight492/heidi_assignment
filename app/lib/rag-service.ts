import { AzureChatOpenAI } from '@langchain/azure-openai';
import { generateEmbedding } from './embeddings';
import { searchTherapeuticGuidelines } from './database';
import { Patient } from '../types/medical';
import {
  RAG_GUIDELINES_SYSTEM_PROMPT,
  RAG_GUIDELINES_PROMPT,
  RAG_GUIDELINES_FILTER_PROMPT,
  RAG_GUIDELINES_SYNTHESIS_PROMPT
} from '../prompts';

export interface RAGGuidelineChunk {
  id: string;
  content: string;
  metadata: {
    title: string;
    section: string;
    evidenceLevel: string;
    source: string;
    version: string;
    date: string;
  };
  relevanceScore?: number;
  reasoning?: string;
  keyPoints?: string[];
}

export interface RAGRecommendation {
  guidelineAnalysis: string;
  evidenceAssessment: string;
  recommendations: Array<{
    medication: string;
    dose: string;
    frequency: string;
    duration: string;
    route: string;
    evidenceLevel: string;
    guidelineSource: string;
  }>;
  safetyConsiderations: string[];
  monitoring: string[];
  evidenceLevel: string;
  confidence: number;
  guidelineSources: string[];
  warnings: string[];
}

export interface RAGResult {
  retrievedChunks: RAGGuidelineChunk[];
  filteredChunks: RAGGuidelineChunk[];
  synthesis: {
    synthesis: string;
    conflicts: string[];
    consensus: string;
    patientSpecific: string;
    finalRecommendations: string;
  };
  finalRecommendation: RAGRecommendation;
  retrievalMetrics: {
    totalChunks: number;
    relevantChunks: number;
    averageRelevanceScore: number;
    processingTime: number;
  };
}

export class RAGService {
  private model: AzureChatOpenAI;

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
      temperature: 0.2, // Low temperature for consistent medical recommendations
    });
  }

  /**
   * Main RAG pipeline for therapeutic guidelines
   */
  async processRAG(
    patient: Patient,
    condition: string,
    severity: string,
    presentingComplaint: string,
    maxChunks: number = 10
  ): Promise<RAGResult> {
    const startTime = Date.now();

    try {
      // Step 1: Retrieve relevant guideline chunks
      const retrievedChunks = await this.retrieveGuidelines(condition, severity, maxChunks * 2);

      // Step 2: Filter and rank chunks by relevance
      const filteredChunks = await this.filterAndRankChunks(
        retrievedChunks,
        patient,
        condition,
        severity
      );

      // Step 3: Synthesize information from top chunks
      const synthesis = await this.synthesizeGuidelines(
        filteredChunks.slice(0, maxChunks),
        patient,
        condition,
        severity
      );

      // Step 4: Generate final recommendation
      const finalRecommendation = await this.generateRecommendation(
        filteredChunks.slice(0, maxChunks),
        patient,
        condition,
        severity,
        presentingComplaint
      );

      const processingTime = Date.now() - startTime;

      return {
        retrievedChunks,
        filteredChunks,
        synthesis,
        finalRecommendation,
        retrievalMetrics: {
          totalChunks: retrievedChunks.length,
          relevantChunks: filteredChunks.length,
          averageRelevanceScore: filteredChunks.length > 0 
            ? filteredChunks.reduce((sum, chunk) => sum + (chunk.relevanceScore || 0), 0) / filteredChunks.length 
            : 0,
          processingTime
        }
      };

    } catch (error) {
      console.error('RAG processing error:', error);
      throw new Error(`RAG processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get essential RAG information for follow-up steps (summary + highly relevant chunks only)
   */
  getEssentialRAGInfo(ragResult: RAGResult, relevanceThreshold: number = 0.7): {
    summary: {
      synthesis: string;
      finalRecommendation: RAGRecommendation;
    };
    highlyRelevantChunks: RAGGuidelineChunk[];
  } {
    // Get all chunks with relevance score above threshold, sorted by relevance
    const highlyRelevantChunks = ragResult.filteredChunks
      .filter(chunk => (chunk.relevanceScore || 0) > relevanceThreshold)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    return {
      summary: {
        synthesis: ragResult.synthesis.synthesis,
        finalRecommendation: ragResult.finalRecommendation
      },
      highlyRelevantChunks
    };
  }

  /**
   * Step 1: Retrieve relevant guideline chunks using semantic search
   */
  private async retrieveGuidelines(
    condition: string,
    severity: string,
    limit: number
  ): Promise<RAGGuidelineChunk[]> {
    try {
      // Create a search query that combines condition and severity
      const searchQuery = `${condition} ${severity} treatment guidelines`;
      const queryEmbedding = await generateEmbedding(searchQuery);
      
      const guidelines = await searchTherapeuticGuidelines(queryEmbedding, limit);
      
      return guidelines.map(guideline => ({
        id: guideline.id,
        content: guideline.content,
        metadata: {
          title: guideline.metadata?.header1 || guideline.metadata?.header3 || 'Unknown',
          section: guideline.metadata?.header4 || guideline.metadata?.header3 || 'Unknown',
          evidenceLevel: 'Unknown', // Not available in current metadata
          source: guideline.metadata?.source || 'Unknown',
          version: 'Unknown', // Not available in current metadata
          date: 'Unknown' // Not available in current metadata
        }
      }));
    } catch (error) {
      console.error('Error retrieving guidelines:', error);
      throw new Error('Failed to retrieve therapeutic guidelines');
    }
  }

  /**
   * Step 2: Filter and rank chunks by relevance to the specific clinical scenario
   */
  private async filterAndRankChunks(
    chunks: RAGGuidelineChunk[],
    patient: Patient,
    condition: string,
    severity: string
  ): Promise<RAGGuidelineChunk[]> {
    if (chunks.length === 0) {
      return [];
    }

    try {
      const filterPrompt = RAG_GUIDELINES_FILTER_PROMPT
        .replace('{patientInfo}', JSON.stringify(patient))
        .replace('{condition}', condition)
        .replace('{severity}', severity)
        .replace('{guidelineChunks}', JSON.stringify(chunks, null, 2));

      const response = await this.model.invoke([
        ['system', RAG_GUIDELINES_SYSTEM_PROMPT],
        ['human', filterPrompt]
      ]);

      let filteredResults: Array<{
        chunkId: string;
        relevanceScore: number;
        reasoning: string;
        keyPoints: string[];
      }> = [];

      try {
        // Handle potential markdown formatting in LLM response
        let content = response.content as string;
        
        // Remove markdown code blocks if present
        if (content.includes('```json')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (content.includes('```')) {
          content = content.replace(/```\n?/g, '');
        }
        
        // Trim whitespace
        content = content.trim();
        
        filteredResults = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse filter results:', response.content);
        // Fallback: return all chunks with default scores
        return chunks.map(chunk => ({
          ...chunk,
          relevanceScore: 50,
          reasoning: 'Default relevance score due to parsing error',
          keyPoints: []
        }));
      }

      // Apply filtering and ranking
      const filteredChunks = chunks
        .map(chunk => {
          const filterResult = filteredResults.find(result => result.chunkId === chunk.id);
          return {
            ...chunk,
            relevanceScore: filterResult?.relevanceScore || 0,
            reasoning: filterResult?.reasoning || 'No relevance assessment available',
            keyPoints: filterResult?.keyPoints || []
          };
        })
        .filter(chunk => chunk.relevanceScore >= 50) // Only include relevant chunks
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)); // Sort by relevance

      return filteredChunks;
    } catch (error) {
      console.error('Error filtering chunks:', error);
      // Fallback: return all chunks with default scores
      return chunks.map(chunk => ({
        ...chunk,
        relevanceScore: 50,
        reasoning: 'Default relevance score due to filtering error',
        keyPoints: []
      }));
    }
  }

  /**
   * Step 3: Synthesize information from multiple guideline sources
   */
  private async synthesizeGuidelines(
    chunks: RAGGuidelineChunk[],
    patient: Patient,
    condition: string,
    severity: string
  ): Promise<{
    synthesis: string;
    conflicts: string[];
    consensus: string;
    patientSpecific: string;
    finalRecommendations: string;
  }> {
    if (chunks.length === 0) {
      return {
        synthesis: 'No relevant guidelines found for synthesis',
        conflicts: [],
        consensus: 'No guidelines available for consensus analysis',
        patientSpecific: 'No patient-specific recommendations available',
        finalRecommendations: 'No recommendations available due to lack of relevant guidelines'
      };
    }

    try {
      const synthesisPrompt = RAG_GUIDELINES_SYNTHESIS_PROMPT
        .replace('{patientInfo}', JSON.stringify(patient))
        .replace('{condition}', condition)
        .replace('{severity}', severity)
        .replace('{rankedGuidelines}', JSON.stringify(chunks, null, 2));

      const response = await this.model.invoke([
        ['system', RAG_GUIDELINES_SYSTEM_PROMPT],
        ['human', synthesisPrompt]
      ]);

      let synthesis: {
        synthesis: string;
        conflicts: string[];
        consensus: string;
        patientSpecific: string;
        finalRecommendations: string;
      };

      try {
        // Handle potential markdown formatting in LLM response
        let content = response.content as string;
        
        // Remove markdown code blocks if present
        if (content.includes('```json')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (content.includes('```')) {
          content = content.replace(/```\n?/g, '');
        }
        
        // Trim whitespace
        content = content.trim();
        
        synthesis = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse synthesis results:', response.content);
        // Fallback synthesis
        synthesis = {
          synthesis: 'Synthesis failed due to parsing error. Using available guideline information.',
          conflicts: ['Unable to identify conflicts due to parsing error'],
          consensus: 'Unable to determine consensus due to parsing error',
          patientSpecific: 'Unable to provide patient-specific analysis due to parsing error',
          finalRecommendations: 'Please review individual guideline chunks for recommendations'
        };
      }

      return synthesis;
    } catch (error) {
      console.error('Error synthesizing guidelines:', error);
      throw new Error('Failed to synthesize therapeutic guidelines');
    }
  }

  /**
   * Step 4: Generate final evidence-based recommendation
   */
  private async generateRecommendation(
    chunks: RAGGuidelineChunk[],
    patient: Patient,
    condition: string,
    severity: string,
    presentingComplaint: string
  ): Promise<RAGRecommendation> {
    if (chunks.length === 0) {
      return {
        guidelineAnalysis: 'No relevant guidelines found for analysis',
        evidenceAssessment: 'No evidence available for assessment',
        recommendations: [],
        safetyConsiderations: ['No guidelines available for safety assessment'],
        monitoring: ['No guidelines available for monitoring recommendations'],
        evidenceLevel: 'Unknown',
        confidence: 0,
        guidelineSources: [],
        warnings: ['No guidelines available - clinical judgment required']
      };
    }

    try {
      const recommendationPrompt = RAG_GUIDELINES_PROMPT
        .replace('{patientInfo}', JSON.stringify(patient))
        .replace('{condition}', condition)
        .replace('{severity}', severity)
        .replace('{presentingComplaint}', presentingComplaint)
        .replace('{retrievedGuidelines}', JSON.stringify(chunks, null, 2));

      const response = await this.model.invoke([
        ['system', RAG_GUIDELINES_SYSTEM_PROMPT],
        ['human', recommendationPrompt]
      ]);

      let recommendation: RAGRecommendation;

      try {
        // Handle potential markdown formatting in LLM response
        let content = response.content as string;
        
        // Remove markdown code blocks if present
        if (content.includes('```json')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (content.includes('```')) {
          content = content.replace(/```\n?/g, '');
        }
        
        // Trim whitespace
        content = content.trim();
        
        recommendation = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse recommendation:', response.content);
        // Fallback recommendation
        recommendation = {
          guidelineAnalysis: 'Recommendation parsing failed. Review individual guidelines.',
          evidenceAssessment: 'Unable to assess evidence due to parsing error',
          recommendations: [],
          safetyConsiderations: ['Clinical judgment required - review individual guidelines'],
          monitoring: ['Standard monitoring recommended - review individual guidelines'],
          evidenceLevel: 'Unknown',
          confidence: 0,
          guidelineSources: chunks.map(chunk => chunk.metadata.source),
          warnings: ['Recommendation parsing failed - clinical judgment required']
        };
      }

      return recommendation;
    } catch (error) {
      console.error('Error generating recommendation:', error);
      throw new Error('Failed to generate evidence-based recommendation');
    }
  }
} 