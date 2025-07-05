import { NextRequest, NextResponse } from 'next/server';
import { AgenticClinicalSystem } from '../../lib/agentic-clinical-system';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Transcript is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting Agentic Clinical Decision Processing...');
    
    // Initialize the agentic clinical system
    const agenticSystem = new AgenticClinicalSystem();
    
    // Process the clinical decision using the agentic approach
    const agenticResult = await agenticSystem.processAgenticDecision(transcript);
    
    console.log(`✅ Agentic processing completed in ${agenticResult.totalProcessingTime}ms`);
    console.log(`🔄 Iterations: ${agenticResult.iterationCount}`);
    console.log(`🔍 Search strategies: ${agenticResult.searchStrategies.length}`);
    
    return NextResponse.json({
      success: true,
      result: agenticResult,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime: agenticResult.totalProcessingTime,
        iterationCount: agenticResult.iterationCount,
        searchStrategiesUsed: agenticResult.searchStrategies.length,
        agentCollaborationRounds: agenticResult.agentCollaboration.length
      }
    });

  } catch (error) {
    console.error('Agentic Clinical Decision API Error:', error);
    
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
        error: 'Failed to process agentic clinical decision',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Agentic Clinical Decision API is running. This endpoint provides AI-powered clinical decision support using multi-agent collaboration.',
    features: [
      'Multi-agent collaborative reasoning',
      'Dynamic search strategies',
      'Iterative refinement',
      'Evidence synthesis',
      'Safety monitoring',
      'Medication optimization'
    ],
    status: 'ready'
  });
}