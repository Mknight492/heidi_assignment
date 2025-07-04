import { NextRequest, NextResponse } from 'next/server';
import { searchTherapeuticGuidelines } from '../../lib/database';
import { generateEmbedding } from '../../lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10, iterations = 5 } = await request.json();
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    const results = {
      query,
      limit,
      iterations,
      performance: {
        embeddingGeneration: [] as number[],
        databaseQuery: [] as number[],
        totalTime: [] as number[]
      },
      averageTimes: {
        embeddingGeneration: 0,
        databaseQuery: 0,
        totalTime: 0
      },
      results: [] as any[]
    };

    // Generate embedding once and reuse
    const embeddingStart = Date.now();
    const queryEmbedding = await generateEmbedding(query);
    const embeddingTime = Date.now() - embeddingStart;
    results.performance.embeddingGeneration.push(embeddingTime);

    // Run multiple iterations to get average performance
    for (let i = 0; i < iterations; i++) {
      const totalStart = Date.now();
      
      const dbStart = Date.now();
      const guidelines = await searchTherapeuticGuidelines(queryEmbedding, limit);
      const dbTime = Date.now() - dbStart;
      
      const totalTime = Date.now() - totalStart;
      
      results.performance.databaseQuery.push(dbTime);
      results.performance.totalTime.push(totalTime);
      
      if (i === 0) {
        results.results = guidelines;
      }
    }

    // Calculate averages
    results.averageTimes.embeddingGeneration = results.performance.embeddingGeneration.reduce((a, b) => a + b, 0) / results.performance.embeddingGeneration.length;
    results.averageTimes.databaseQuery = results.performance.databaseQuery.reduce((a, b) => a + b, 0) / results.performance.databaseQuery.length;
    results.averageTimes.totalTime = results.performance.totalTime.reduce((a, b) => a + b, 0) / results.performance.totalTime.length;

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('RAG performance test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 