import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, bulkStoreTherapeuticGuidelineChunks, clearTherapeuticGuidelines } from '../../lib/database';
import { TherapeuticGuidelineChunk } from '../../types/medical';
import { generateEmbeddings, testEmbeddingService } from '../../lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check if it's a JSON file
    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'File must be a JSON file' },
        { status: 400 }
      );
    }
    
    // Read the file content
    const fileContent = await file.text();
    let guidelines: TherapeuticGuidelineChunk[];
    
    try {
      guidelines = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    // Validate the structure
    if (!Array.isArray(guidelines)) {
      return NextResponse.json(
        { error: 'JSON must contain an array of guideline chunks' },
        { status: 400 }
      );
    }
    
    // Test embedding service before processing
    const embeddingTest = await testEmbeddingService();
    if (!embeddingTest.success) {
      return NextResponse.json(
        { error: `Embedding service test failed: ${embeddingTest.error}` },
        { status: 500 }
      );
    }
    
    // Clear existing therapeutic guidelines (optional - you might want to keep them)
    const clearExisting = formData.get('clearExisting') === 'true';
    if (clearExisting) {
      await clearTherapeuticGuidelines();
    }
    
    // Optimized processing with larger batches and parallel processing
    const batchSize = 50; // Increased from 10 to 50
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`Processing ${guidelines.length} guidelines in batches of ${batchSize}`);
    
    // Process in larger batches for better performance
    for (let i = 0; i < guidelines.length; i += batchSize) {
      const batch = guidelines.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(guidelines.length / batchSize)}`);
      
      try {
        // Generate embeddings for the entire batch at once
        const texts = batch.map(chunk => chunk.text);
        const embeddings = await generateEmbeddings(texts);
        
        // Prepare chunks with embeddings for bulk insert
        const chunksWithEmbeddings = batch.map((chunk, index) => ({
          chunk,
          embedding: embeddings[index]
        }));
        
        // Validate chunks before bulk insert
        const validChunks = [];
        const invalidResults = [];
        
        for (let j = 0; j < chunksWithEmbeddings.length; j++) {
          const { chunk, embedding } = chunksWithEmbeddings[j];
          
          if (!chunk.text || !chunk.metadata) {
            console.warn('Skipping invalid chunk:', chunk);
            invalidResults.push({
              success: false,
              error: 'Invalid chunk structure',
              metadata: chunk.metadata
            });
            errorCount++;
          } else {
            validChunks.push({ chunk, embedding });
          }
        }
        
        // Bulk insert valid chunks
        if (validChunks.length > 0) {
          const ids = await bulkStoreTherapeuticGuidelineChunks(validChunks);
          
          // Add successful results
          for (let j = 0; j < validChunks.length; j++) {
            results.push({
              id: ids[j],
              success: true,
              metadata: validChunks[j].chunk.metadata
            });
            successCount++;
          }
        }
        
        // Add invalid results
        results.push(...invalidResults);
        
      } catch (error) {
        console.error('Error processing batch:', error);
        // Mark all chunks in this batch as failed
        for (const chunk of batch) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Batch processing failed',
            metadata: chunk.metadata
          });
          errorCount++;
        }
      }
    }
    
    return NextResponse.json({
      message: 'Upload completed',
      summary: {
        total: guidelines.length,
        successful: successCount,
        failed: errorCount
      },
      embeddingInfo: {
        dimensions: embeddingTest.dimensions,
        model: 'text-embedding-3-large'
      },
      performance: {
        batchSize,
        totalBatches: Math.ceil(guidelines.length / batchSize)
      },
      results
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await initializeDatabase();
    
    // Test embedding service
    const embeddingTest = await testEmbeddingService();
    
    return NextResponse.json({
      message: 'Therapeutic Guidelines upload endpoint is ready',
      instructions: 'Send a POST request with a JSON file containing an array of guideline chunks',
      embeddingService: {
        status: embeddingTest.success ? 'ready' : 'error',
        dimensions: embeddingTest.dimensions,
        error: embeddingTest.error
      }
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Database initialization failed' },
      { status: 500 }
    );
  }
} 