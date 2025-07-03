'use client';

import { useState, useEffect } from 'react';
import { VectorizedTherapeuticGuideline } from '../types/medical';

export default function ViewTherapeuticGuidelines() {
  const [guidelines, setGuidelines] = useState<VectorizedTherapeuticGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async (query?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = query 
        ? `/api/therapeutic-guidelines?query=${encodeURIComponent(query)}&limit=50`
        : '/api/therapeutic-guidelines?limit=50';

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch guidelines');
      }

      setGuidelines(data.guidelines || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guidelines');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchGuidelines();
      return;
    }

    setSearching(true);
    try {
      const response = await fetch('/api/therapeutic-guidelines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery, limit: 50 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setGuidelines(data.guidelines || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchGuidelines();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Therapeutic Guidelines Database
          </h1>
          <p className="text-gray-600 mb-8">
            View and search uploaded therapeutic guideline chunks
          </p>

          {/* Search Section */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guidelines by content or headers..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {searching ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-semibold text-green-800">
                    {totalCount} guideline chunks
                  </span>
                  {searchQuery && (
                    <span className="text-sm text-green-600 ml-2">
                      matching "{searchQuery}"
                    </span>
                  )}
                </div>
                <div className="text-sm text-green-600">
                  Showing {guidelines.length} results
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center">
                <svg className="animate-spin h-8 w-8 text-green-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-600">Loading guidelines...</span>
              </div>
            </div>
          )}

          {/* Guidelines List */}
          {!loading && guidelines.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No guidelines found
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'No guidelines match your search criteria.'
                  : 'No therapeutic guidelines have been uploaded yet.'
                }
              </p>
            </div>
          )}

          {!loading && guidelines.length > 0 && (
            <div className="space-y-6">
              {guidelines.map((guideline) => (
                <div key={guideline.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {guideline.metadata.header1 || guideline.metadata.header3 || 'Untitled'}
                      </h3>
                      {guideline.metadata.header4 && (
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {guideline.metadata.header4}
                        </h4>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                      ID: {guideline.id}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-800 leading-relaxed">
                      {guideline.content.length > 500 
                        ? `${guideline.content.substring(0, 500)}...`
                        : guideline.content
                      }
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Source: {guideline.metadata.source}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      Chunk: {guideline.metadata.chunk_id}.{guideline.metadata.subchunk_id}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Length: {guideline.metadata.length} chars
                    </span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Reference: {guideline.metadata.reference}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 