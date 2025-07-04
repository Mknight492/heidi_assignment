import { NextRequest, NextResponse } from 'next/server';
import { RAGService } from '../../lib/rag-service';
import { Patient } from '../../types/medical';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      patient, 
      condition, 
      severity, 
      presentingComplaint,
      maxChunks = 10 
    } = body;

    // Validate required fields
    if (!patient || !condition || !severity || !presentingComplaint) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: patient, condition, severity, and presentingComplaint are required' 
        },
        { status: 400 }
      );
    }

    // Validate patient object
    if (!patient.name || !patient.age || !patient.weight) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid patient data: name, age, and weight are required' 
        },
        { status: 400 }
      );
    }

    // Validate severity
    if (!['mild', 'moderate', 'severe'].includes(severity)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid severity: must be mild, moderate, or severe' 
        },
        { status: 400 }
      );
    }

    // Initialize RAG service
    const ragService = new RAGService();

    // Process RAG pipeline
    const ragResult = await ragService.processRAG(
      patient as Patient,
      condition,
      severity,
      presentingComplaint,
      maxChunks
    );

    return NextResponse.json({
      success: true,
      result: ragResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('RAG Guidelines API Error:', error);
    
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
        error: 'Failed to process RAG guidelines',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'RAG Guidelines API is running',
    endpoints: {
      POST: {
        description: 'Process RAG pipeline for therapeutic guidelines',
        body: {
          patient: 'Patient object with name, age, weight, etc.',
          condition: 'Medical condition (string)',
          severity: 'mild | moderate | severe',
          presentingComplaint: 'Patient presenting complaint (string)',
          maxChunks: 'Maximum number of guideline chunks to process (optional, default: 10)'
        },
        response: {
          success: 'boolean',
          result: 'RAGResult object with retrieved chunks, filtered chunks, synthesis, and final recommendation',
          timestamp: 'ISO timestamp'
        }
      }
    }
  });
} 