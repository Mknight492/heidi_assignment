import { NextRequest, NextResponse } from 'next/server';
import { AzureChatOpenAI } from '@langchain/azure-openai';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
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
    
    // Better error details
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
        error: 'Failed to generate response',
        details: errorMessage
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