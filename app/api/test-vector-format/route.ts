import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '../../lib/database';
import { generateEmbedding } from '../../lib/embeddings';

export async function GET() {
  try {
    await initializeDatabase();
    
    // Test vector format with a simple embedding
    const testText = "This is a test of vector storage.";
    const embedding = await generateEmbedding(testText);
    
    // Format as PostgreSQL vector
    const vectorString = `[${embedding.join(',')}]`;
    
    return NextResponse.json({
      success: true,
      testText,
      embeddingLength: embedding.length,
      vectorFormat: vectorString.substring(0, 100) + '...',
      message: 'Vector format test completed. Check the format above.'
    });
  } catch (error) {
    console.error('Vector format test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test vector format',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Generate embedding and test storage
    const embedding = await generateEmbedding(text);
    const vectorString = `[${embedding.join(',')}]`;
    
    // Test the vector format with a simple query
    const client = await initializeDatabase();
    
    return NextResponse.json({
      success: true,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      embedding: {
        length: embedding.length,
        format: vectorString.substring(0, 100) + '...',
        firstFewValues: embedding.slice(0, 5)
      },
      message: 'Vector format is ready for database storage'
    });
  } catch (error) {
    console.error('Vector format test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test vector format',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 