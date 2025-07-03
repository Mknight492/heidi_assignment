'use client';

import { useState } from 'react';

export default function LLMTestPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/hello-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.response);
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            LLM Integration Test
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Test Azure OpenAI Integration
            </h2>
            <p className="text-gray-600 mb-4">
              This page tests the full flow: UI → Backend API → Azure OpenAI → Response
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your message:
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Try: 'Hello, can you help me with a medical question about croup?'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send to LLM'}
            </button>
          </form>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium mb-2">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {response && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-800 font-medium mb-2">LLM Response:</h3>
              <div className="text-green-700 whitespace-pre-wrap">{response}</div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <h3 className="text-gray-800 font-medium mb-2">How it works:</h3>
            <ol className="text-gray-600 text-sm space-y-1">
              <li>1. You enter a message in the text area above</li>
              <li>2. The frontend sends a POST request to <code className="bg-gray-200 px-1 rounded">/api/hello-llm</code></li>
              <li>3. The backend API calls Azure OpenAI using LangChain</li>
              <li>4. The LLM response is returned to the frontend</li>
              <li>5. The response is displayed in the green box above</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 