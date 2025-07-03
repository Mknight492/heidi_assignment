'use client';

import { useState } from 'react';

export default function ApiDemo() {
  const [getData, setGetData] = useState<any>(null);
  const [postData, setPostData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [inputData, setInputData] = useState('');

  const handleGetRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hello');
      const data = await response.json();
      setGetData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setGetData({ error: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const handlePostRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hello', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputData }),
      });
      const data = await response.json();
      setPostData(data);
    } catch (error) {
      console.error('Error posting data:', error);
      setPostData({ error: 'Failed to post data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Next.js API Demo</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* GET Request Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">GET Request</h2>
            <button
              onClick={handleGetRequest}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mb-4"
            >
              {loading ? 'Loading...' : 'Fetch Data'}
            </button>
            
            {getData && (
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">Response:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(getData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* POST Request Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">POST Request</h2>
            <div className="mb-4">
              <input
                type="text"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Enter some data to send..."
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <button
              onClick={handlePostRequest}
              disabled={loading || !inputData}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mb-4"
            >
              {loading ? 'Sending...' : 'Send Data'}
            </button>
            
            {postData && (
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">Response:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(postData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">How it works:</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold">API Routes:</h3>
              <p>API routes are created in the <code className="bg-gray-100 px-1 rounded">app/api/</code> directory. Each folder represents an endpoint.</p>
            </div>
            <div>
              <h3 className="font-semibold">File Structure:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs">
{`app/
├── api/
│   └── hello/
│       └── route.ts    # Handles /api/hello requests
└── api-demo/
    └── page.tsx        # This demo page`}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold">Available Endpoints:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">GET /api/hello</code> - Returns a greeting message</li>
                <li><code className="bg-gray-100 px-1 rounded">POST /api/hello</code> - Accepts JSON data and echoes it back</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 