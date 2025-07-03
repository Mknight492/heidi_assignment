import { NextRequest, NextResponse } from 'next/server';
import { testEmbeddingService, generateEmbedding } from '../../lib/embeddings';

export async function GET() {
  try {
    const testResult = await testEmbeddingService();
    
    return NextResponse.json({
      success: testResult.success,
      embeddingService: {
        status: testResult.success ? 'ready' : 'error',
        dimensions: testResult.dimensions,
        model: 'text-embedding-3-large',
        error: testResult.error
      },
      message: testResult.success 
        ? 'Embedding service is working correctly' 
        : 'Embedding service test failed'
    });
  } catch (error) {
    console.error('Embedding test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test embedding service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Generate embedding for the provided text
    const embedding = await generateEmbedding(text);
    
    return NextResponse.json({
      success: true,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      embedding: {
        dimensions: embedding.length,
        values: embedding.slice(0, 5), // Show first 5 values as preview
        model: 'text-embedding-3-large'
      }
    });
  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate embedding',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 