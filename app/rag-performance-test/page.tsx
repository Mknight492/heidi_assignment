'use client';

import { useState } from 'react';

interface PerformanceResult {
  query: string;
  limit: number;
  iterations: number;
  performance: {
    embeddingGeneration: number[];
    databaseQuery: number[];
    totalTime: number[];
  };
  averageTimes: {
    embeddingGeneration: number;
    databaseQuery: number;
    totalTime: number;
  };
  results: any[];
}

export default function RAGPerformanceTest() {
  const [query, setQuery] = useState('croup treatment guidelines');
  const [limit, setLimit] = useState(10);
  const [iterations, setIterations] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PerformanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const runPerformanceTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/rag-performance-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit,
          iterations
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const optimizeDatabase = async (action: string) => {
    setOptimizing(true);
    setError(null);

    try {
      const response = await fetch('/api/optimize-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      if (action === 'cache-stats') {
        setCacheStats(data.cacheStats);
      } else {
        alert(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">RAG Performance Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter search query..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Result Limit
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Iterations
            </label>
            <input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value))}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <button
          onClick={runPerformanceTest}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Running Performance Test...' : 'Run Performance Test'}
        </button>
      </div>

      {/* Database Optimization Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Database Optimization</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => optimizeDatabase('optimize')}
            disabled={optimizing}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {optimizing ? 'Optimizing...' : 'Full Optimize'}
          </button>
          
          <button
            onClick={() => optimizeDatabase('reinitialize')}
            disabled={optimizing}
            className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {optimizing ? 'Reinitializing...' : 'Reinitialize DB'}
          </button>
          
          <button
            onClick={() => optimizeDatabase('clear-cache')}
            disabled={optimizing}
            className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {optimizing ? 'Clearing...' : 'Clear Cache'}
          </button>
          
          <button
            onClick={() => optimizeDatabase('cache-stats')}
            disabled={optimizing}
            className="bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {optimizing ? 'Loading...' : 'Cache Stats'}
          </button>
        </div>

        {cacheStats && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Cache Statistics</h3>
            <p><strong>Cache Size:</strong> {cacheStats.size} entries</p>
            {cacheStats.entries.length > 0 && (
              <div className="mt-2">
                <strong>Recent Entries:</strong>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                  {cacheStats.entries.slice(0, 3).map((entry: any, index: number) => (
                    <li key={index}>
                      {entry.key} (age: {Math.round(entry.age / 1000)}s)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {result.averageTimes.embeddingGeneration.toFixed(1)}ms
                </div>
                <div className="text-sm text-gray-600">Embedding Generation</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.averageTimes.databaseQuery.toFixed(1)}ms
                </div>
                <div className="text-sm text-gray-600">Database Query</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {result.averageTimes.totalTime.toFixed(1)}ms
                </div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Query Details</h3>
              <p><strong>Query:</strong> {result.query}</p>
              <p><strong>Limit:</strong> {result.limit} results</p>
              <p><strong>Iterations:</strong> {result.iterations}</p>
              <p><strong>Results Found:</strong> {result.results.length}</p>
            </div>
          </div>

          {/* Detailed Performance Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Detailed Performance Data</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Iteration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Embedding (ms)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Database (ms)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total (ms)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.performance.databaseQuery.map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.performance.embeddingGeneration[index]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.performance.databaseQuery[index]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.performance.totalTime[index]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Sample Results (First Iteration)</h2>
            
            <div className="space-y-4">
              {result.results.slice(0, 3).map((guideline, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {guideline.metadata?.title || `Guideline ${guideline.id}`}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {guideline.content.substring(0, 200)}...
                  </p>
                  <div className="text-xs text-gray-500">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      ID: {guideline.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 