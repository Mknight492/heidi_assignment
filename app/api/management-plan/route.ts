import { NextRequest, NextResponse } from 'next/server';
import { AzureChatOpenAI } from '@langchain/azure-openai';
import { Patient, ClinicalDecision, DoseCalculation } from '../../types/medical';
import { RAGService } from '../../lib/rag-service';
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
    
    // Initialize Azure OpenAI model
    const model = new AzureChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
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
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\n?/g, '');
      }
      
      content = content.trim();
      patient = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse patient data:', patientResponse.content);
      throw new Error('Failed to extract patient data from transcript');
    }

    // Step 2: Determine condition and severity
    console.log('Step 2: Assessing condition and severity...');
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
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\n?/g, '');
      }
      
      content = content.trim();
      conditionData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse condition data:', conditionResponse.content);
      throw new Error('Failed to determine condition and severity');
    }

    // Step 3: Process RAG to retrieve relevant guidelines for management and treatment
    console.log('Step 3: Retrieving relevant guidelines via RAG...');
    let ragResult = null;
    let relevantGuidelines: any[] = [];
    try {
      const ragService = new RAGService();
      ragResult = await ragService.processRAG(
        patient,
        conditionData.condition,
        conditionData.severity,
        patient.presentingComplaint,
        10 // Increased limit for comprehensive guidelines
      );
      relevantGuidelines = ragResult.retrievedChunks;
    } catch (ragError) {
      console.error('RAG processing failed, continuing without guidelines:', ragError);
      // Continue without RAG results
    }

    // Step 4: Generate comprehensive management plan based on guidelines
    console.log('Step 4: Generating management plan...');
    const managementPrompt = MANAGEMENT_PLAN_PROMPT
      .replace('{patientInfo}', JSON.stringify(patient))
      .replace('{condition}', conditionData.condition)
      .replace('{severity}', conditionData.severity)
      .replace('{medications}', '[]') // No medications yet, will be calculated in next step
      .replace('{guidelines}', relevantGuidelines.length > 0 ? JSON.stringify(relevantGuidelines) : 'No specific guidelines available')
      .replace('{guidelineSummary}', ragResult ? JSON.stringify({
        synthesis: ragResult.synthesis,
        finalRecommendation: ragResult.finalRecommendation
      }) : 'No guideline summary available');

    const managementResponse = await model.invoke([
      ['system', MANAGEMENT_PLAN_SYSTEM_PROMPT],
      ['human', managementPrompt]
    ]);

    // Step 5: Calculate drug doses based on management plan and guidelines
    console.log('Step 5: Calculating drug doses...');
    const medicationPrompt = MEDICATION_RECOMMENDATIONS_PROMPT
      .replace('{patientInfo}', JSON.stringify(patient))
      .replace('{condition}', conditionData.condition)
      .replace('{severity}', conditionData.severity)
      .replace('{guidelines}', relevantGuidelines.length > 0 ? JSON.stringify(relevantGuidelines) : 'No specific guidelines available')
      .replace('{guidelineSummary}', ragResult ? JSON.stringify({
        synthesis: ragResult.synthesis,
        finalRecommendation: ragResult.finalRecommendation
      }) : 'No guideline summary available')
      .replace('{managementPlan}', managementResponse.content as string);

    const medicationResponse = await model.invoke([
      ['system', MEDICATION_RECOMMENDATIONS_SYSTEM_PROMPT],
      ['human', medicationPrompt]
    ]);

    let medicationRecommendations: DoseCalculation[] = [];
    try {
      let content = medicationResponse.content as string;
      
      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\n?/g, '');
      }
      
      content = content.trim();
      medicationRecommendations = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse medication data:', medicationResponse.content);
      // Continue without medication recommendations
    }

    // Step 6: Calculate overall confidence
    const overallConfidence = Math.round(
      (conditionData.confidence + 
       (medicationRecommendations.length > 0 ? 
         medicationRecommendations.reduce((sum, med) => sum + med.confidence, 0) / medicationRecommendations.length : 
         0)) / 2
    );

    // Construct the final result
    const result: ClinicalDecision = {
      patient,
      condition: conditionData.condition,
      severity: conditionData.severity,
      relevantGuidelines: relevantGuidelines,
      medicationRecommendations,
      managementPlan: managementResponse.content as string,
      confidence: overallConfidence,
      evidenceSummary: ragResult 
        ? `Based on clinical assessment of ${conditionData.condition} with ${conditionData.severity} severity, supported by ${relevantGuidelines.length} relevant therapeutic guidelines.`
        : `Based on clinical assessment of ${conditionData.condition} with ${conditionData.severity} severity.`,
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