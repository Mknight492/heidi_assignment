import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getAllTherapeuticGuidelines, searchTherapeuticGuidelines } from '../../lib/database';
import { generateEmbedding, testEmbeddingService } from '../../lib/embeddings';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (query) {
      // Test embedding service
      const embeddingTest = await testEmbeddingService();
      if (!embeddingTest.success) {
        return NextResponse.json(
          { error: `Embedding service not available: ${embeddingTest.error}` },
          { status: 500 }
        );
      }
      
      // Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(query);
      
      // Perform semantic search
      const guidelines = await searchTherapeuticGuidelines(queryEmbedding, limit);
      
      return NextResponse.json({
        guidelines,
        total: guidelines.length,
        query,
        searchType: 'semantic',
        embeddingInfo: {
          dimensions: embeddingTest.dimensions,
          model: 'text-embedding-3-large'
        }
      });
    } else {
      const guidelines = await getAllTherapeuticGuidelines();
      return NextResponse.json({
        guidelines: guidelines.slice(0, limit),
        total: guidelines.length,
        searchType: 'all'
      });
    }
  } catch (error) {
    console.error('Error fetching therapeutic guidelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch therapeutic guidelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const body = await request.json();
    const { query, limit = 5 } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Test embedding service
    const embeddingTest = await testEmbeddingService();
    if (!embeddingTest.success) {
      return NextResponse.json(
        { error: `Embedding service not available: ${embeddingTest.error}` },
        { status: 500 }
      );
    }
    
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    
    // Perform semantic search
    const guidelines = await searchTherapeuticGuidelines(queryEmbedding, limit);
    
    return NextResponse.json({
      guidelines,
      total: guidelines.length,
      query,
      searchType: 'semantic',
      embeddingInfo: {
        dimensions: embeddingTest.dimensions,
        model: 'text-embedding-3-large'
      }
    });
  } catch (error) {
    console.error('Error searching therapeutic guidelines:', error);
    return NextResponse.json(
      { error: 'Failed to search therapeutic guidelines' },
      { status: 500 }
    );
  }
} 