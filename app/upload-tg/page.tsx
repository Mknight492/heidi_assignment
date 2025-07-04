'use client';

import { useState } from 'react';
import { TherapeuticGuidelineChunk } from '../types/medical';

interface UploadResult {
  id?: number;
  success: boolean;
  error?: string;
  metadata?: any;
}

interface UploadSummary {
  total: number;
  successful: number;
  failed: number;
}

interface UploadPerformance {
  batchSize: number;
  totalBatches: number;
}

export default function UploadTherapeuticGuidelines() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [performance, setPerformance] = useState<UploadPerformance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [previewData, setPreviewData] = useState<TherapeuticGuidelineChunk[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    processedItems: number;
    totalItems: number;
  } | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setResults([]);
    setSummary(null);

    // Preview the file content
    try {
      const content = await selectedFile.text();
      const data = JSON.parse(content);
      
      if (Array.isArray(data)) {
        setPreviewData(data.slice(0, 3)); // Show first 3 items as preview
      } else {
        setError('File must contain an array of guideline chunks');
      }
    } catch (err) {
      setError('Invalid JSON file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clearExisting', clearExisting.toString());

      const response = await fetch('/api/upload-tg', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResults(data.results || []);
      setSummary(data.summary);
      setPerformance(data.performance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all therapeutic guidelines from the database?')) {
      return;
    }

    try {
      const response = await fetch('/api/upload-tg', {
        method: 'POST',
        body: new FormData(), // Empty form data
      });

      if (!response.ok) {
        throw new Error('Failed to clear database');
      }

      alert('Database cleared successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear database');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Therapeutic Guidelines
          </h1>
          <p className="text-gray-600 mb-8">
            Upload JSON files containing therapeutic guideline chunks to the vector database
          </p>

          {/* File Upload Section */}
          <div className="mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-lg font-medium text-gray-900">
                  {file ? file.name : 'Choose a JSON file'}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  {file ? 'Click to change file' : 'or drag and drop'}
                </span>
              </label>
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Clear existing therapeutic guidelines before upload
              </span>
            </label>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview (first 3 items)</h3>
              <div className="space-y-3">
                {previewData.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Header:</strong> {item.metadata.header1 || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-800 line-clamp-2">
                      {item.text.substring(0, 200)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-800">Processing Upload</h3>
                <span className="text-sm text-blue-600">
                  {uploadProgress ? `${uploadProgress.processedItems}/${uploadProgress.totalItems} items` : 'Initializing...'}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: uploadProgress 
                      ? `${(uploadProgress.processedItems / uploadProgress.totalItems) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                {uploadProgress && (
                  <>
                    Batch {uploadProgress.currentBatch} of {uploadProgress.totalBatches} • 
                    {Math.round((uploadProgress.processedItems / uploadProgress.totalItems) * 100)}% complete
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload to Database'
              )}
            </button>

            <button
              onClick={handleClearDatabase}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
            >
              Clear Database
            </button>
          </div>

          {/* Results Summary */}
          {summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upload Summary</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                  <div className="text-sm text-blue-800">Total Items</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
                  <div className="text-sm text-green-800">Successful</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                  <div className="text-sm text-red-800">Failed</div>
                </div>
              </div>
              
              {/* Performance Information */}
              {performance && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Batch Size:</span>
                      <span className="ml-2 font-medium">{performance.batchSize} items</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Batches:</span>
                      <span className="ml-2 font-medium">{performance.totalBatches}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Results */}
          {results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upload Results</h3>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {result.success ? (
                            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="text-sm font-medium">
                            {result.success ? `ID: ${result.id}` : 'Failed'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.metadata?.header1 || 'No header'}
                        </div>
                      </div>
                      {result.error && (
                        <div className="mt-1 text-xs text-red-600">{result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 