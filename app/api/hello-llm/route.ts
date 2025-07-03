import { NextRequest, NextResponse } from 'next/server';
import { ChatAzureOpenAI } from '@langchain/azure-openai';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    // Initialize Azure OpenAI model
    const model = new ChatAzureOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      temperature: 0.7,
    });

    // Generate response
    const response = await model.invoke([
      ['system', 'You are a helpful medical AI assistant. Provide concise, accurate responses.'],
      ['human', message || 'Hello, can you help me with a medical question?']
    ]);

    return NextResponse.json({
      success: true,
      response: response.content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LLM API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'LLM API is running. Send a POST request with a message to test.',
    status: 'ready'
  });
} 