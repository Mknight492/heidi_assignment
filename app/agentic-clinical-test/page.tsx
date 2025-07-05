'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface AgenticResult {
  patientAnalysis: {
    agent: string;
    reasoning: string;
    confidence: number;
    recommendations: string[];
    concerns: string[];
    needsMoreInfo: boolean;
    suggestedQueries: string[];
  };
  guidelineAnalysis: {
    agent: string;
    reasoning: string;
    confidence: number;
    recommendations: string[];
    concerns: string[];
    needsMoreInfo: boolean;
    suggestedQueries: string[];
  };
  medicationAnalysis: {
    agent: string;
    reasoning: string;
    confidence: number;
    recommendations: string[];
    concerns: string[];
    needsMoreInfo: boolean;
    suggestedQueries: string[];
  };
  safetyAnalysis: {
    agent: string;
    reasoning: string;
    confidence: number;
    recommendations: string[];
    concerns: string[];
    needsMoreInfo: boolean;
    suggestedQueries: string[];
  };
  finalDecision: {
    patient: {
      name: string;
      age: number;
      weight: number;
      presentingComplaint: string;
      history: string;
      examination: string;
      assessment: string;
    };
    condition: string;
    severity: string;
    managementPlan: string;
    confidence: number;
    evidenceSummary: string;
    warnings: string[];
  };
  iterationCount: number;
  totalProcessingTime: number;
  searchStrategies: Array<{
    query: string;
    strategy: string;
    results: any[];
    relevanceScore: number;
    searchTime: number;
  }>;
  agentCollaboration: Array<{
    iteration: number;
    discussions: Array<{
      fromAgent: string;
      toAgent: string;
      question: string;
      response: string;
    }>;
  }>;
}

export default function AgenticClinicalTest() {
  const [transcript, setTranscript] = useState(`Patient: Jack T.
DOB: 12/03/2022
Age: 3 years
Weight: 14.2 kg

Presenting complaint:
Jack presented with a 2-day history of barky cough, hoarse voice, and low-grade fever. Symptoms worsened overnight, with increased work of breathing and stridor noted at rest this morning. No history of choking, foreign body aspiration, or recent travel. No known sick contacts outside the household. 

History:
- Onset of URTI symptoms 2 days ago, including rhinorrhoea and dry cough
- Barking cough began yesterday evening, hoarseness and intermittent inspiratory stridor overnight
- Mild fever (up to 38.4°C) controlled with paracetamol
- No cyanosis or apnoea reported
- Fully vaccinated and developmentally appropriate for age
- No history of asthma or other chronic respiratory illness
- No previous episodes of croup
- No drug allergies

Examination:
- Alert, mildly distressed, sitting upright with audible inspiratory stridor at rest
- Barky cough noted during assessment
- Mild suprasternal and intercostal recession
- RR 32, HR 124, SpO2 97% on room air, T 37.9°C
- Chest: clear air entry bilaterally, no wheeze or crackles
- ENT: mild erythema of oropharynx, no tonsillar exudate
- CVS: normal S1/S2, no murmurs
- Neurological: alert, interactive, normal tone and reflexes

Assessment:
Jack presents with classic features of moderate croup (laryngotracheobronchitis), likely viral in origin. No signs of severe respiratory distress or impending airway obstruction. No signs suggestive of bacterial tracheitis or other differentials (e.g. foreign body, epiglottitis).

Plan:
- Administer corticosteroids
- Plan as per local guidelines for croup`);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgenticResult | null>(null);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('overview');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/agentic-clinical-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Failed to process agentic clinical decision');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const agents = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'clinical-assessment', name: 'Clinical Assessment', icon: '🏥' },
    { id: 'guideline-search', name: 'Guideline Search', icon: '📚' },
    { id: 'medication-specialist', name: 'Medication Specialist', icon: '💊' },
    { id: 'safety-monitoring', name: 'Safety Monitoring', icon: '🛡️' },
    { id: 'collaboration', name: 'Agent Collaboration', icon: '🤝' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🤖 Agentic Clinical Decision System</h1>
          <p className="text-lg text-gray-600 mb-4">
            Advanced multi-agent AI system for superior clinical reasoning and decision making
          </p>
          <div className="flex justify-center">
            <Link
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              ← Back to Main System
            </Link>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🧠</span>
              <h3 className="font-semibold text-gray-900">Multi-Agent Reasoning</h3>
            </div>
            <p className="text-sm text-gray-600">Specialized AI agents collaborate to provide comprehensive clinical analysis</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🔍</span>
              <h3 className="font-semibold text-gray-900">Dynamic Search</h3>
            </div>
            <p className="text-sm text-gray-600">Adaptive search strategies that refine based on findings</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">🔄</span>
              <h3 className="font-semibold text-gray-900">Iterative Refinement</h3>
            </div>
            <p className="text-sm text-gray-600">Continuous improvement through agent collaboration</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Clinical Transcript Input</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
                Patient Transcript:
              </label>
              <textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Enter the patient's clinical transcript..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                rows={12}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !transcript.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing with Agentic System...
                </div>
              ) : (
                '🚀 Launch Agentic Analysis'
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🎯 Agentic Analysis Results</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>⏱️ {result.totalProcessingTime}ms</span>
                <span>🔄 {result.iterationCount} iterations</span>
                <span>🔍 {result.searchStrategies.length} searches</span>
              </div>
            </div>

            {/* Agent Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedAgent === agent.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {agent.icon} {agent.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Agent-Specific Content */}
            {selectedAgent === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🏥</span>
                      <h3 className="font-semibold text-blue-900">Clinical Assessment</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">{Math.round(result.patientAnalysis.confidence * 100)}%</p>
                    <p className="text-sm text-blue-600">Confidence</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">📚</span>
                      <h3 className="font-semibold text-green-900">Guidelines</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-800">{Math.round(result.guidelineAnalysis.confidence * 100)}%</p>
                    <p className="text-sm text-green-600">Confidence</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">💊</span>
                      <h3 className="font-semibold text-purple-900">Medications</h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-800">{Math.round(result.medicationAnalysis.confidence * 100)}%</p>
                    <p className="text-sm text-purple-600">Confidence</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🛡️</span>
                      <h3 className="font-semibold text-orange-900">Safety</h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-800">{Math.round(result.safetyAnalysis.confidence * 100)}%</p>
                    <p className="text-sm text-orange-600">Confidence</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Final Clinical Decision</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Condition</p>
                      <p className="font-medium text-gray-900">{result.finalDecision.condition}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Severity</p>
                      <p className="font-medium text-gray-900 capitalize">{result.finalDecision.severity}</p>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{result.finalDecision.managementPlan}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {selectedAgent === 'clinical-assessment' && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Clinical Assessment Agent Analysis</h3>
                  <p className="text-blue-800 mb-4">{result.patientAnalysis.reasoning}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside text-sm text-blue-700">
                        {result.patientAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Concerns</h4>
                      <ul className="list-disc list-inside text-sm text-blue-700">
                        {result.patientAnalysis.concerns.map((concern, index) => (
                          <li key={index}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedAgent === 'guideline-search' && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Guideline Search Agent Analysis</h3>
                  <p className="text-green-800 mb-4">{result.guidelineAnalysis.reasoning}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Key Recommendations</h4>
                      <ul className="list-disc list-inside text-sm text-green-700">
                        {result.guidelineAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Gaps Identified</h4>
                      <ul className="list-disc list-inside text-sm text-green-700">
                        {result.guidelineAnalysis.concerns.map((concern, index) => (
                          <li key={index}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Search Strategies Used</h3>
                  <div className="space-y-2">
                    {result.searchStrategies.map((strategy, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{strategy.query}</span>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="bg-gray-200 px-2 py-1 rounded">{strategy.strategy}</span>
                          <span>{strategy.searchTime}ms</span>
                          <span>{strategy.results.length} results</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedAgent === 'medication-specialist' && (
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">Medication Specialist Agent Analysis</h3>
                  <p className="text-purple-800 mb-4">{result.medicationAnalysis.reasoning}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-purple-900 mb-2">Medication Recommendations</h4>
                      <ul className="list-disc list-inside text-sm text-purple-700">
                        {result.medicationAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-900 mb-2">Contraindications</h4>
                      <ul className="list-disc list-inside text-sm text-purple-700">
                        {result.medicationAnalysis.concerns.map((concern, index) => (
                          <li key={index}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedAgent === 'safety-monitoring' && (
              <div className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">Safety Monitoring Agent Analysis</h3>
                  <p className="text-orange-800 mb-4">{result.safetyAnalysis.reasoning}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-orange-900 mb-2">Safety Checks</h4>
                      <ul className="list-disc list-inside text-sm text-orange-700">
                        {result.safetyAnalysis.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-900 mb-2">Risk Factors</h4>
                      <ul className="list-disc list-inside text-sm text-orange-700">
                        {result.safetyAnalysis.concerns.map((concern, index) => (
                          <li key={index}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedAgent === 'collaboration' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Agent Collaboration History</h3>
                  {result.agentCollaboration.length > 0 ? (
                    <div className="space-y-3">
                      {result.agentCollaboration.map((round, index) => (
                        <div key={index} className="bg-white rounded p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Iteration {round.iteration}</h4>
                          {round.discussions.map((discussion, dIndex) => (
                            <div key={dIndex} className="mb-2 p-2 bg-gray-50 rounded">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">{discussion.fromAgent}</span> → <span className="font-medium">{discussion.toAgent}</span>
                              </p>
                              <p className="text-sm text-gray-600 mt-1"><strong>Q:</strong> {discussion.question}</p>
                              <p className="text-sm text-gray-600 mt-1"><strong>A:</strong> {discussion.response}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-yellow-700">No agent collaboration occurred (high initial confidence)</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}