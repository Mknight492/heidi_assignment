'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
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
  const [result, setResult] = useState<any>(null);
  const [ragInfo, setRagInfo] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/management-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        setRagInfo(data.ragInfo || null);
      } else {
        setError(data.error || 'Failed to generate management plan');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        <h1 className="text-2xl font-bold text-center">Heidi Medical AI Assignment</h1>
        
        {/* Main Clinical Decision Support Interface */}
        <div className="w-full bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Clinical Decision Support System</h2>
          <p className="text-gray-600 mb-6 text-center">
            Enter a patient transcript to generate a comprehensive management plan with medication dosing recommendations.
          </p>
          
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
                Patient Transcript:
              </label>
              <textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Enter the patient's clinical transcript here. Include age, weight, presenting complaint, history, and examination findings..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                rows={8}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !transcript.trim()}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Generating Management Plan...' : 'Generate Management Plan'}
            </button>
          </form>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium mb-2">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-800 font-bold mb-4">Management Plan:</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <h4 className="font-bold text-gray-900">Patient Information:</h4>
                  <pre className="text-sm text-gray-900 bg-white p-2 rounded border overflow-auto">{JSON.stringify(result.patient, null, 2)}</pre>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <h4 className="font-bold text-gray-900">Condition & Severity:</h4>
                  <p className="text-gray-900">{result.condition} - {result.severity}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <h4 className="font-bold text-gray-900">Management Plan:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{result.managementPlan}</p>
                </div>
                {result.medicationRecommendations && result.medicationRecommendations.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <h4 className="font-bold text-gray-900">Medication Recommendations:</h4>
                    <pre className="text-sm text-gray-900 bg-white p-2 rounded border overflow-auto">{JSON.stringify(result.medicationRecommendations, null, 2)}</pre>
                  </div>
                )}
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <h4 className="font-bold text-gray-900">Confidence Score:</h4>
                  <p className="text-gray-700">{result.confidence}%</p>
                </div>
                
                {/* Guidelines Used Section */}
                {ragInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h4 className="font-bold text-blue-900 mb-3">📚 Therapeutic Guidelines Used:</h4>
                    
                    {/* RAG Metrics */}
                    <div className="mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="font-semibold text-blue-800">{ragInfo.retrievedChunks}</div>
                          <div className="text-blue-600">Retrieved</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="font-semibold text-green-800">{ragInfo.filteredChunks}</div>
                          <div className="text-green-600">Relevant</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="font-semibold text-purple-800">{ragInfo.retrievalMetrics?.processingTime || 0}ms</div>
                          <div className="text-purple-600">Processing</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="font-semibold text-orange-800">{ragInfo.retrievalMetrics?.averageRelevanceScore?.toFixed(1) || 0}</div>
                          <div className="text-orange-600">Avg Score</div>
                        </div>
                      </div>
                    </div>

                    {/* Guideline Sources */}
                    {result.relevantGuidelines && result.relevantGuidelines.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-blue-800 mb-2">Guideline Sources:</h5>
                        <div className="space-y-2">
                          {Array.from(new Set(result.relevantGuidelines.map((g: any) => g.metadata.source))).map((source: any, index: number) => (
                            <div key={index} className="bg-white rounded p-2 flex items-center">
                              <span className="text-blue-600 mr-2">📄</span>
                              <span className="text-sm font-medium">{source}</span>
                              <span className="ml-auto text-xs text-gray-500">
                                {result.relevantGuidelines.filter((g: any) => g.metadata.source === source).length} chunks
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                                         )}

                     {/* Retrieved Guideline Chunks */}
                     {result.relevantGuidelines && result.relevantGuidelines.length > 0 && (
                       <div className="mb-4">
                         <h5 className="font-semibold text-blue-800 mb-2">Retrieved Guideline Chunks:</h5>
                         <div className="space-y-2 max-h-40 overflow-y-auto">
                           {result.relevantGuidelines.slice(0, 5).map((guideline: any, index: number) => (
                             <div key={index} className="bg-white rounded p-2 text-xs border border-gray-200">
                               <div className="flex items-start justify-between mb-1">
                                 <span className="font-medium text-gray-800">
                                   {guideline.metadata.header1 || guideline.metadata.header3 || 'Untitled'}
                                 </span>
                                 <span className="text-gray-500 text-xs">
                                   {guideline.metadata.source}
                                 </span>
                               </div>
                               <p className="text-gray-600 line-clamp-2">
                                 {guideline.content.substring(0, 150)}...
                               </p>
                             </div>
                           ))}
                           {result.relevantGuidelines.length > 5 && (
                             <div className="text-center text-xs text-gray-500">
                               ... and {result.relevantGuidelines.length - 5} more chunks
                             </div>
                           )}
                         </div>
                       </div>
                     )}

                     {/* RAG Synthesis */}
                    {ragInfo.synthesis && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-blue-800 mb-2">Guideline Analysis:</h5>
                        <div className="bg-white rounded p-3 text-sm">
                          <p className="text-gray-700 mb-2">
                            <strong>Synthesis:</strong> {ragInfo.synthesis.synthesis}
                          </p>
                          <p className="text-gray-700 mb-2">
                            <strong>Consensus:</strong> {ragInfo.synthesis.consensus}
                          </p>
                          {ragInfo.synthesis.conflicts && ragInfo.synthesis.conflicts.length > 0 && (
                            <div className="mb-2">
                              <strong className="text-gray-700">Conflicts:</strong>
                              <ul className="list-disc list-inside text-gray-600 ml-2 mt-1">
                                {ragInfo.synthesis.conflicts.map((conflict: string, index: number) => (
                                  <li key={index} className="text-xs">{conflict}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RAG Recommendations */}
                    {ragInfo.finalRecommendation && (
                      <div>
                        <h5 className="font-semibold text-blue-800 mb-2">Evidence-Based Recommendations:</h5>
                        <div className="bg-white rounded p-3 text-sm">
                          <p className="text-gray-700 mb-2">
                            <strong>Guideline Analysis:</strong> {ragInfo.finalRecommendation.guidelineAnalysis}
                          </p>
                          <p className="text-gray-700 mb-2">
                            <strong>Evidence Level:</strong> {ragInfo.finalRecommendation.evidenceLevel}
                          </p>
                          <p className="text-gray-700 mb-2">
                            <strong>Confidence:</strong> {ragInfo.finalRecommendation.confidence}%
                          </p>
                          
                          {ragInfo.finalRecommendation.recommendations && ragInfo.finalRecommendation.recommendations.length > 0 && (
                            <div className="mb-2">
                              <strong className="text-gray-700">Treatment Recommendations:</strong>
                              <div className="space-y-1 mt-1">
                                {ragInfo.finalRecommendation.recommendations.map((rec: any, index: number) => (
                                  <div key={index} className="bg-green-50 rounded p-2 text-xs">
                                    <strong>{rec.medication}</strong> - {rec.dose} {rec.frequency} ({rec.evidenceLevel})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {ragInfo.finalRecommendation.safetyConsiderations && ragInfo.finalRecommendation.safetyConsiderations.length > 0 && (
                            <div className="mb-2">
                              <strong className="text-gray-700">Safety Considerations:</strong>
                              <ul className="list-disc list-inside text-gray-600 ml-2 mt-1">
                                {ragInfo.finalRecommendation.safetyConsiderations.map((item: string, index: number) => (
                                  <li key={index} className="text-xs">{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/llm-test"
          >
            LLM Integration Test
          </Link>
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/api-demo"
          >
            Basic API Demo
          </Link>
          <Link
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="/users-demo"
          >
            Users CRUD Demo
          </Link>
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-orange-600 text-white gap-2 hover:bg-orange-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/db-test"
          >
            Database Test
          </Link>
        </div>

        {/* Therapeutic Guidelines Section */}
        <div className="w-full max-w-2xl">
          <h2 className="text-lg font-semibold mb-4 text-center">Therapeutic Guidelines Database</h2>
          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <Link
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-purple-600 text-white gap-2 hover:bg-purple-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
              href="/upload-tg"
            >
              Upload Guidelines
            </Link>
            <Link
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-indigo-600 text-white gap-2 hover:bg-indigo-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
              href="/view-tg"
            >
              View Guidelines
            </Link>
            <Link
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-pink-600 text-white gap-2 hover:bg-pink-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
              href="/test-embeddings"
            >
              Test Embeddings
            </Link>
            <Link
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-teal-600 text-white gap-2 hover:bg-teal-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
              href="/rag-test"
            >
              RAG Test
            </Link>
          </div>
        </div>

        <div className="text-center max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">What's included:</h2>
          <ul className="text-sm space-y-2 text-left">
            <li>• <strong>Clinical Decision Support</strong> - Main interface for patient transcript analysis</li>
            <li>• <strong>LLM Integration Test</strong> - Test Azure OpenAI integration with full UI flow</li>
            <li>• <strong>Basic API Demo</strong> - Simple GET and POST requests</li>
            <li>• <strong>Users CRUD Demo</strong> - Full CRUD operations with a mock database</li>
            <li>• <strong>Database Test</strong> - Test PostgreSQL connection and pgvector setup</li>
            <li>• <strong>Therapeutic Guidelines Upload</strong> - Upload JSON files to vector database</li>
            <li>• <strong>Therapeutic Guidelines View</strong> - Search and view uploaded guidelines</li>
            <li>• <strong>RAG Test</strong> - Retrieval-Augmented Generation with therapeutic guidelines</li>
            <li>• <strong>Embedding Service Test</strong> - Test Azure OpenAI text-embedding-3-large integration</li>
            <li>• <strong>API Routes</strong> - Examples of different HTTP methods</li>
            <li>• <strong>Frontend Integration</strong> - How to call APIs from React components</li>
          </ul>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org Test →
        </a>
      </footer>
    </div>
  );
}
