'use client';

import { useState } from 'react';

export default function DatabaseTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/db-test');
      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Database connection failed');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/db-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || `Action '${action}' failed`);
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
            Database Connection Test
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              PostgreSQL + pgvector Setup Test
            </h2>
            <p className="text-gray-600 mb-4">
              This page tests the PostgreSQL database connection and pgvector extension setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              onClick={() => performAction('init')}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Initializing...' : 'Initialize Database'}
            </button>
            
            <button
              onClick={() => performAction('list')}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'List Guidelines'}
            </button>
            
            <button
              onClick={() => performAction('clear')}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Clearing...' : 'Clear Guidelines'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium mb-2">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-800 font-medium mb-2">Result:</h3>
              <pre className="text-green-700 text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <h3 className="text-gray-800 font-medium mb-2">Environment Variables Required:</h3>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• <code className="bg-gray-200 px-1 rounded">PGHOST</code> - Database host (default: localhost)</li>
              <li>• <code className="bg-gray-200 px-1 rounded">PGPORT</code> - Database port (default: 5432)</li>
              <li>• <code className="bg-gray-200 px-1 rounded">PGDATABASE</code> - Database name (default: heidi_medical_ai)</li>
              <li>• <code className="bg-gray-200 px-1 rounded">PGUSER</code> - Database user (default: postgres)</li>
              <li>• <code className="bg-gray-200 px-1 rounded">PGPASSWORD</code> - Database password (required)</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h3 className="text-blue-800 font-medium mb-2">What each button does:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• <strong>Test Connection</strong> - Verifies database connectivity and pgvector extension</li>
              <li>• <strong>Initialize Database</strong> - Creates tables and indexes for vector storage</li>
              <li>• <strong>List Guidelines</strong> - Shows all guidelines currently in the database</li>
              <li>• <strong>Clear Guidelines</strong> - Removes all guidelines from the database</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 