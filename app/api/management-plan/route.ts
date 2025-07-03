import { NextRequest, NextResponse } from 'next/server';
import { AzureChatOpenAI } from '@langchain/azure-openai';
import { Patient, ClinicalDecision, DoseCalculation } from '../../types/medical';

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
    const patientExtractionPrompt = `
You are a medical AI assistant. Extract patient information from the following clinical transcript and return it as a JSON object.

Required fields:
- name: string (if mentioned, otherwise "Unknown")
- age: number (in years)
- weight: number (in kg)
- height: number (in cm, if mentioned)
- sex: "M" or "F" (if mentioned)
- presentingComplaint: string (main complaint)
- history: string (relevant history)
- examination: string (examination findings)
- assessment: string (clinical assessment)

Transcript: ${transcript}

Return ONLY the JSON object, no additional text.
`;

    const patientResponse = await model.invoke([
      ['system', 'You are a medical AI assistant that extracts structured patient data from clinical transcripts. Return only valid JSON without any markdown formatting or code blocks.'],
      ['human', patientExtractionPrompt]
    ]);

    let patient: Patient;
    try {
      // Handle potential markdown formatting in LLM response
      let content = patientResponse.content as string;
      
      // Remove markdown code blocks if present
      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\n?/g, '');
      }
      
      // Trim whitespace
      content = content.trim();
      
      patient = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse patient data:', patientResponse.content);
      throw new Error('Failed to extract patient data from transcript');
    }

    // Step 2: Determine condition and severity
    const conditionPrompt = `
Based on the patient information and transcript, determine the primary condition and severity.

Patient Info: ${JSON.stringify(patient)}
Transcript: ${transcript}

Return a JSON object with:
- condition: string (primary diagnosis)
- severity: "mild", "moderate", or "severe"
- confidence: number (0-100)

Return ONLY the JSON object, no additional text.
`;

    const conditionResponse = await model.invoke([
      ['system', 'You are a medical AI assistant that determines conditions and severity from clinical data. Return only valid JSON without any markdown formatting or code blocks.'],
      ['human', conditionPrompt]
    ]);

    let conditionData: { condition: string; severity: 'mild' | 'moderate' | 'severe'; confidence: number };
    try {
      // Handle potential markdown formatting in LLM response
      let content = conditionResponse.content as string;
      
      // Remove markdown code blocks if present
      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\n?/g, '');
      }
      
      // Trim whitespace
      content = content.trim();
      
      conditionData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse condition data:', conditionResponse.content);
      throw new Error('Failed to determine condition and severity');
    }

    // Step 3: Generate medication recommendations
    const medicationPrompt = `
Based on the patient information and condition, generate medication recommendations with dosing calculations.

Patient: ${JSON.stringify(patient)}
Condition: ${conditionData.condition}
Severity: ${conditionData.severity}

For pediatric patients, consider:
- Weight-based dosing
- Age-appropriate medications
- Safety considerations

Return a JSON array of medication recommendations with:
- medication: string
- dose: number
- unit: string
- frequency: string
- route: string
- rationale: string
- evidenceLevel: "A", "B", "C", or "D"
- confidence: number (0-100)
- safetyChecks: string[]
- calculatedDose: number (weight-based calculation)
- doseRange: { min: number, max: number }
- warnings: string[]

Return ONLY the JSON array, no additional text.
`;

    const medicationResponse = await model.invoke([
      ['system', 'You are a medical AI assistant that generates evidence-based medication recommendations. Return only valid JSON without any markdown formatting or code blocks.'],
      ['human', medicationPrompt]
    ]);

    let medicationRecommendations: DoseCalculation[] = [];
    try {
      // Handle potential markdown formatting in LLM response
      let content = medicationResponse.content as string;
      
      // Remove markdown code blocks if present
      if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\n?/g, '');
      }
      
      // Trim whitespace
      content = content.trim();
      
      medicationRecommendations = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse medication data:', medicationResponse.content);
      // Continue without medication recommendations
    }

    // Step 4: Generate comprehensive management plan
    const managementPrompt = `
Generate a comprehensive management plan for this patient.

Patient: ${JSON.stringify(patient)}
Condition: ${conditionData.condition}
Severity: ${conditionData.severity}
Medications: ${JSON.stringify(medicationRecommendations)}

Create a detailed management plan that includes:
1. Immediate management steps
2. Monitoring requirements
3. Follow-up recommendations
4. Patient education points
5. When to seek further medical attention

Return a comprehensive, well-structured management plan as plain text.
`;

    const managementResponse = await model.invoke([
      ['system', 'You are a medical AI assistant that creates comprehensive management plans. Provide clear, actionable recommendations.'],
      ['human', managementPrompt]
    ]);

    // Step 5: Calculate overall confidence
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
      relevantGuidelines: [], // Will be populated when we integrate with vector database
      medicationRecommendations,
      managementPlan: managementResponse.content as string,
      confidence: overallConfidence,
      evidenceSummary: `Based on clinical assessment of ${conditionData.condition} with ${conditionData.severity} severity.`,
      warnings: medicationRecommendations.flatMap(med => med.warnings || []),
      timestamp: new Date()
    };

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

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