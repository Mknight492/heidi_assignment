'use client';

import { useState } from 'react';
import { Patient } from '../types/medical';

interface RAGTestResult {
  retrievedChunks: any[];
  filteredChunks: any[];
  synthesis: {
    synthesis: string;
    conflicts: string[];
    consensus: string;
    patientSpecific: string;
    finalRecommendations: string;
  };
  finalRecommendation: {
    guidelineAnalysis: string;
    evidenceAssessment: string;
    recommendations: any[];
    safetyConsiderations: string[];
    monitoring: string[];
    evidenceLevel: string;
    confidence: number;
    guidelineSources: string[];
    warnings: string[];
  };
  retrievalMetrics: {
    totalChunks: number;
    relevantChunks: number;
    averageRelevanceScore: number;
    processingTime: number;
  };
}

export default function RAGTestPage() {
  const [patient, setPatient] = useState<Patient>({
    name: 'Test Patient',
    dob: new Date('2020-01-01'),
    age: 3,
    weight: 15,
    height: 95,
    sex: 'M',
    presentingComplaint: 'Barking cough and stridor for 2 days',
    history: 'Started with cold symptoms 3 days ago, developed barking cough yesterday',
    examination: 'Mild stridor, barking cough, no respiratory distress',
    assessment: 'Croup'
  });

  const [condition, setCondition] = useState('croup');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [presentingComplaint, setPresentingComplaint] = useState('Barking cough and stridor');
  const [maxChunks, setMaxChunks] = useState(10);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RAGTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/rag-guidelines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient,
          condition,
          severity,
          presentingComplaint,
          maxChunks
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process RAG guidelines');
      }

      if (data.success) {
        setResult(data.result);
      } else {
        throw new Error(data.error || 'RAG processing failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePatient = (field: keyof Patient, value: any) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            RAG Guidelines Test
          </h1>
          <p className="text-gray-600">
            Test the Retrieval-Augmented Generation pipeline for therapeutic guidelines
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-medium mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={patient.name}
                      onChange={(e) => updatePatient('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age (years)
                    </label>
                    <input
                      type="number"
                      value={patient.age}
                      onChange={(e) => updatePatient('age', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={patient.weight}
                      onChange={(e) => updatePatient('weight', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sex
                    </label>
                    <select
                      value={patient.sex || ''}
                      onChange={(e) => updatePatient('sex', e.target.value as 'M' | 'F')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Clinical Information */}
              <div>
                <h3 className="text-lg font-medium mb-3">Clinical Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    <input
                      type="text"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as 'mild' | 'moderate' | 'severe')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presenting Complaint
                    </label>
                    <textarea
                      value={presentingComplaint}
                      onChange={(e) => setPresentingComplaint(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Chunks
                    </label>
                    <input
                      type="number"
                      value={maxChunks}
                      onChange={(e) => setMaxChunks(parseInt(e.target.value))}
                      min="1"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing RAG...' : 'Process RAG Guidelines'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing RAG pipeline...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Metrics */}
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="text-lg font-medium mb-3">Retrieval Metrics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Chunks:</span> {result.retrievalMetrics.totalChunks}
                    </div>
                    <div>
                      <span className="font-medium">Relevant Chunks:</span> {result.retrievalMetrics.relevantChunks}
                    </div>
                    <div>
                      <span className="font-medium">Avg Relevance Score:</span> {result.retrievalMetrics.averageRelevanceScore.toFixed(1)}
                    </div>
                    <div>
                      <span className="font-medium">Processing Time:</span> {result.retrievalMetrics.processingTime}ms
                    </div>
                  </div>
                </div>

                {/* Synthesis */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Guideline Synthesis</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Synthesis:</strong> {result.synthesis.synthesis}
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Consensus:</strong> {result.synthesis.consensus}
                    </p>
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Patient Specific:</strong> {result.synthesis.patientSpecific}
                    </p>
                    {result.synthesis.conflicts.length > 0 && (
                      <div className="mb-3">
                        <strong className="text-sm text-gray-700">Conflicts:</strong>
                        <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                          {result.synthesis.conflicts.map((conflict, index) => (
                            <li key={index}>{conflict}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Recommendation */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Final Recommendation</h3>
                  <div className="bg-blue-50 rounded-md p-4">
                    <div className="mb-3">
                      <strong className="text-sm text-gray-700">Guideline Analysis:</strong>
                      <p className="text-sm text-gray-600 mt-1">{result.finalRecommendation.guidelineAnalysis}</p>
                    </div>
                    <div className="mb-3">
                      <strong className="text-sm text-gray-700">Evidence Assessment:</strong>
                      <p className="text-sm text-gray-600 mt-1">{result.finalRecommendation.evidenceAssessment}</p>
                    </div>
                    <div className="mb-3">
                      <strong className="text-sm text-gray-700">Evidence Level:</strong> {result.finalRecommendation.evidenceLevel}
                    </div>
                    <div className="mb-3">
                      <strong className="text-sm text-gray-700">Confidence:</strong> {result.finalRecommendation.confidence}%
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {result.finalRecommendation.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Treatment Recommendations</h3>
                    <div className="space-y-3">
                      {result.finalRecommendation.recommendations.map((rec, index) => (
                        <div key={index} className="bg-green-50 rounded-md p-4">
                          <h4 className="font-medium text-green-800">{rec.medication}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm text-green-700 mt-2">
                            <div><strong>Dose:</strong> {rec.dose}</div>
                            <div><strong>Frequency:</strong> {rec.frequency}</div>
                            <div><strong>Route:</strong> {rec.route}</div>
                            <div><strong>Evidence:</strong> {rec.evidenceLevel}</div>
                          </div>
                          <p className="text-sm text-green-600 mt-2">
                            <strong>Source:</strong> {rec.guidelineSource}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety & Monitoring */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.finalRecommendation.safetyConsiderations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Safety Considerations</h3>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {result.finalRecommendation.safetyConsiderations.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.finalRecommendation.monitoring.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Monitoring</h3>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {result.finalRecommendation.monitoring.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Warnings */}
                {result.finalRecommendation.warnings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Warnings</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                        {result.finalRecommendation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Retrieved Chunks */}
                <details className="bg-gray-50 rounded-md p-4">
                  <summary className="text-lg font-medium cursor-pointer">
                    Retrieved Guideline Chunks ({result.retrievedChunks.length})
                  </summary>
                  <div className="mt-4 space-y-3">
                    {result.retrievedChunks.map((chunk, index) => (
                      <div key={index} className="bg-white rounded-md p-3 border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {chunk.metadata.title}
                          </span>
                          {chunk.relevanceScore && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Score: {chunk.relevanceScore}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">{chunk.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Source: {chunk.metadata.source} | Section: {chunk.metadata.section}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 