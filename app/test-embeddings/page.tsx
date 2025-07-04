'use client';

import { useState } from 'react';

interface EmbeddingTestResult {
  success: boolean;
  embeddingService?: {
    status: string;
    dimensions?: number;
    model: string;
    error?: string;
  };
  message?: string;
  error?: string;
  details?: string;
}

interface EmbeddingResult {
  success: boolean;
  text?: string;
  embedding?: {
    dimensions: number;
    values: number[];
    model: string;
  };
  error?: string;
  details?: string;
}

export default function TestEmbeddings() {
  const [testResult, setTestResult] = useState<EmbeddingTestResult | null>(null);
  const [embeddingResult, setEmbeddingResult] = useState<EmbeddingResult | null>(null);
  const [testText, setTestText] = useState('This is a test of the embedding service.');
  const [loading, setLoading] = useState(false);
  const [loadingEmbedding, setLoadingEmbedding] = useState(false);

  const testEmbeddingService = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-embeddings');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Failed to test embedding service',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedding = async () => {
    setLoadingEmbedding(true);
    setEmbeddingResult(null);
    
    try {
      const response = await fetch('/api/test-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testText }),
      });
      const data = await response.json();
      setEmbeddingResult(data);
    } catch (error) {
      setEmbeddingResult({
        success: false,
        error: 'Failed to generate embedding',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoadingEmbedding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Embedding Service Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test the Azure OpenAI text-embedding-3-large integration
          </p>

          {/* Service Test Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Service Status Test
            </h2>
            <button
              onClick={testEmbeddingService}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </>
              ) : (
                'Test Embedding Service'
              )}
            </button>

            {testResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {testResult.success ? (
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">
                    {testResult.success ? 'Service Ready' : 'Service Error'}
                  </span>
                </div>
                
                {testResult.message && (
                  <p className="text-sm mb-2">{testResult.message}</p>
                )}
                
                {testResult.embeddingService && (
                  <div className="text-sm space-y-1">
                    <div><strong>Model:</strong> {testResult.embeddingService.model}</div>
                    <div><strong>Dimensions:</strong> {testResult.embeddingService.dimensions || 'Unknown'}</div>
                    <div><strong>Status:</strong> {testResult.embeddingService.status}</div>
                    {testResult.embeddingService.error && (
                      <div className="text-red-600"><strong>Error:</strong> {testResult.embeddingService.error}</div>
                    )}
                  </div>
                )}
                
                {testResult.error && (
                  <div className="text-sm text-red-600 mt-2">
                    <strong>Error:</strong> {testResult.error}
                  </div>
                )}
                
                {testResult.details && (
                  <div className="text-sm text-gray-600 mt-2">
                    <strong>Details:</strong> {testResult.details}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Embedding Generation Test */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Embedding Generation Test
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Text
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                rows={3}
                placeholder="Enter text to generate embedding for..."
              />
            </div>
            
            <button
              onClick={generateEmbedding}
              disabled={loadingEmbedding || !testText.trim()}
              className="px-6 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loadingEmbedding ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Embedding'
              )}
            </button>

            {embeddingResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                embeddingResult.success 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {embeddingResult.success ? (
                    <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">
                    {embeddingResult.success ? 'Embedding Generated' : 'Generation Failed'}
                  </span>
                </div>
                
                {embeddingResult.success && embeddingResult.embedding && (
                  <div className="text-sm space-y-2">
                    <div><strong>Text:</strong> {embeddingResult.text}</div>
                    <div><strong>Model:</strong> {embeddingResult.embedding.model}</div>
                    <div><strong>Dimensions:</strong> {embeddingResult.embedding.dimensions}</div>
                    <div>
                      <strong>Preview (first 5 values):</strong>
                      <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
                        [{embeddingResult.embedding.values.map(v => v.toFixed(6)).join(', ')}]
                      </div>
                    </div>
                  </div>
                )}
                
                {embeddingResult.error && (
                  <div className="text-sm text-red-600 mt-2">
                    <strong>Error:</strong> {embeddingResult.error}
                  </div>
                )}
                
                {embeddingResult.details && (
                  <div className="text-sm text-gray-600 mt-2">
                    <strong>Details:</strong> {embeddingResult.details}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Environment Variables Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Required Environment Variables
            </h3>
            <div className="text-sm space-y-1">
              <div><code className="bg-gray-200 px-1 rounded">AZURE_OPENAI_API_KEY</code> - Your Azure OpenAI API key</div>
              <div><code className="bg-gray-200 px-1 rounded">AZURE_OPENAI_ENDPOINT</code> - Your Azure OpenAI endpoint URL</div>
              <div><code className="bg-gray-200 px-1 rounded">AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME</code> - Your text-embedding-3-large deployment name</div>
              <div><code className="bg-gray-200 px-1 rounded">AZURE_OPENAI_API_VERSION</code> - API version (optional, defaults to 2024-02-15-preview)</div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Important Note</h4>
              <p className="text-sm text-blue-800">
                This implementation uses <strong>text-embedding-3-large</strong> with embeddings truncated to <strong>1536 dimensions</strong> 
                to ensure compatibility with pgvector's ivfflat index (max 2000 dimensions). 
                The truncation preserves the most important semantic information while maintaining database performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 