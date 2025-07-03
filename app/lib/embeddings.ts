import { AzureOpenAIEmbeddings } from '@langchain/azure-openai';

// Initialize Azure OpenAI embeddings model
let embeddingsModel: AzureOpenAIEmbeddings | null = null;

function getEmbeddingsModel(): AzureOpenAIEmbeddings {
  if (!embeddingsModel) {
    // Check environment variables
    if (!process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('AZURE_OPENAI_API_KEY is not set');
    }
    if (!process.env.AZURE_OPENAI_ENDPOINT) {
      throw new Error('AZURE_OPENAI_ENDPOINT is not set');
    }
    if (!process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME) {
      throw new Error('AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME is not set');
    }

    embeddingsModel = new AzureOpenAIEmbeddings({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      modelName: 'text-embedding-3-large',
    });
  }
  return embeddingsModel;
}

// Truncate embedding to 1536 dimensions for pgvector compatibility
function truncateEmbedding(embedding: number[]): number[] {
  if (embedding.length <= 1536) {
    return embedding;
  }
  console.warn(`Embedding truncated from ${embedding.length} to 1536 dimensions for pgvector compatibility`);
  return embedding.slice(0, 1536);
}

// Generate embedding for a single text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = getEmbeddingsModel();
    const embedding = await model.embedQuery(text);
    return truncateEmbedding(embedding);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate embeddings for multiple texts (batch processing)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const model = getEmbeddingsModel();
    const embeddings = await model.embedDocuments(texts);
    return embeddings.map(truncateEmbedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Test the embedding service
export async function testEmbeddingService(): Promise<{ success: boolean; dimensions?: number; error?: string }> {
  try {
    const testText = "This is a test embedding.";
    const embedding = await generateEmbedding(testText);
    
    return {
      success: true,
      dimensions: embedding.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 