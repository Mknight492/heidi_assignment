'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Progress stages for the clinical management plan generation
const PROGRESS_STAGES = [
  "Extracting patient data...",
  "Analyzing clinical presentation...",
  "Finding relevant therapeutic guidelines...",
  "Retrieving evidence-based recommendations...",
  "Calculating medication dosages...",
  "Synthesizing management plan...",
  "Finalizing recommendations..."
];

// Progress component with spinner
const ProgressIndicator = ({ currentStage }: { currentStage: number }) => {
  return (
    <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-center mb-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <h3 className="text-lg font-semibold text-blue-800">Generating Clinical Management Plan</h3>
      </div>
      
      <div className="space-y-3">
        {PROGRESS_STAGES.map((stage, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 ${
              index < currentStage 
                ? 'bg-green-500' 
                : index === currentStage 
                ? 'bg-blue-500 animate-pulse' 
                : 'bg-gray-300'
            }`}></div>
            <span className={`text-sm ${
              index < currentStage 
                ? 'text-green-700 font-medium' 
                : index === currentStage 
                ? 'text-blue-700 font-semibold' 
                : 'text-gray-500'
            }`}>
              {stage}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="flex justify-between text-xs text-blue-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(((currentStage + 1) / PROGRESS_STAGES.length) * 100)}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((currentStage + 1) / PROGRESS_STAGES.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

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
  const [currentProgressStage, setCurrentProgressStage] = useState(0);

  // Progress update effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (loading) {
      interval = setInterval(() => {
        setCurrentProgressStage(prev => {
          if (prev < PROGRESS_STAGES.length - 1) {
            return prev + 1;
          }
          return prev; // Stay at the last stage
        });
      }, 5800); // Update every 10 seconds
    } else {
      setCurrentProgressStage(0); // Reset when not loading
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setCurrentProgressStage(0);

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
        <h1 className="text-2xl font-bold text-center">Heidi Medical AI Assignment</h1>
        
        {/* Disclaimer */}
        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Important Disclaimer
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This is a <strong>proof of concept</strong> demonstration and should <strong>NOT</strong> be used for clinical decision making. 
                  This system is for educational and research purposes only. Always consult with qualified healthcare professionals 
                  and follow established clinical guidelines for patient care decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
        
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
              {loading ? PROGRESS_STAGES[currentProgressStage] || 'Generating Management Plan...' : 'Generate Management Plan'}
            </button>
          </form>

          {loading && (
            <ProgressIndicator currentStage={currentProgressStage} />
          )}

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
                  <h4 className="font-bold text-gray-900">Condition & Severity:</h4>
                  <p className="text-gray-900">{result.condition} - {result.severity}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <h4 className="font-bold text-gray-900">Management Plan:</h4>
                  <div className="prose prose-sm text-gray-700 max-w-none [&>h1]:text-2xl [&>h1]:font-black [&>h1]:text-gray-900 [&>h1]:mb-4 [&>h1]:mt-6 [&>h1:first-child]:mt-0 [&>h2]:text-xl [&>h2]:font-black [&>h2]:text-gray-800 [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-gray-800 [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:mb-3 [&>ul]:mb-4 [&>ol]:mb-4 [&>li]:mb-1 [&>div]:mb-4">
                    <ReactMarkdown>{result.managementPlan}</ReactMarkdown>
                  </div>
                </div>
                {/* {result.medicationRecommendations && result.medicationRecommendations.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <h4 className="font-bold text-gray-900">Medication Recommendations:</h4>
                    <pre className="text-sm text-gray-900 bg-white p-2 rounded border overflow-auto">{JSON.stringify(result.medicationRecommendations, null, 2)}</pre>
                  </div>
                )} */}
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

                    {/* Most Relevant Guideline */}
                    {result.relevantGuidelines && result.relevantGuidelines.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-blue-800 mb-2">Most Relevant Guideline:</h5>
                        <div className="space-y-2">
                          {result.relevantGuidelines.map((guideline: any, index: number) => {
                            // Clean the source filename for display
                            const cleanSource = guideline.metadata.source.replace(/\.(md|pdf|json)\d+$/i, '.$1').replace(/\d+$/, '');
                            const guidelineLink = guideline.metadata?.guidelineLink;
                            const isMostRelevant = guideline.metadata?.isMostRelevant;
                            const relevanceScore = guideline.metadata?.relevanceScore;
                            
                            return (
                              <div key={index} className="bg-white rounded p-2 flex items-center border-l-4 border-green-500">
                                <span className="mr-2 text-green-600">⭐</span>
                                <div className="flex-1">
                                  {guidelineLink ? (
                                    <a 
                                      href={guidelineLink.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                      title={`${guidelineLink.topic} - ${guidelineLink.subtopic}`}
                                    >
                                      {cleanSource}
                                      <span className="ml-1 text-xs">🔗</span>
                                    </a>
                                  ) : (
                                    <span className="text-sm font-medium text-gray-900" title={guideline.metadata.source}>{cleanSource}</span>
                                  )}
                                  {guidelineLink && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {guidelineLink.topic} - {guidelineLink.subtopic}
                                    </div>
                                  )}
                                </div>
                                <span className="ml-auto text-xs text-gray-500">
                                  Score: {relevanceScore?.toFixed(1) || 'N/A'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                     {/* Most Relevant Guideline Content */}
                     {result.relevantGuidelines && result.relevantGuidelines.length > 0 && (
                       <div className="mb-4">
                         <h5 className="font-semibold text-blue-800 mb-2">Most Relevant Guideline Content:</h5>
                         <div className="space-y-2">
                           {result.relevantGuidelines.map((guideline: any, index: number) => {
                             console.log(guideline);
                             const guidelineLink = guideline.metadata?.guidelineLink;
                             const isMostRelevant = guideline.metadata?.isMostRelevant;
                             const relevanceScore = guideline.metadata?.relevanceScore;
                             
                             return (
                               <div key={index} className="bg-white rounded p-2 text-xs border border-green-300 border-l-4 border-l-green-500">
                                 <div className="flex items-start justify-between mb-1">
                                   <div className="flex-1">
                                     <div className="flex items-center">
                                       <span className="font-medium text-gray-800">
                                         {guideline.metadata.title || guideline.metadata.header4 || guideline.metadata.header3 || guideline.metadata.header1 || 'Untitled'}
                                       </span>
                                       <span className="ml-1 text-green-600 text-xs">⭐</span>
                                       {guidelineLink && (
                                         <a 
                                           href={guidelineLink.url} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           className="ml-1 text-blue-600 hover:text-blue-800 hover:underline"
                                           title={`${guidelineLink.topic} - ${guidelineLink.subtopic}`}
                                         >
                                           🔗
                                         </a>
                                       )}
                                     </div>
                                   </div>
                                   <span className="text-gray-500 text-xs" title={guideline.metadata.source}>
                                     Score: {relevanceScore?.toFixed(1) || 'N/A'}
                                   </span>
                                 </div>
                                 <p className="text-gray-600 line-clamp-3">
                                   {guideline.content.substring(0, 200)}...
                                 </p>
                                 {guidelineLink && (
                                   <div className="text-xs text-gray-500 mt-1">
                                     {guidelineLink.topic} - {guidelineLink.subtopic}
                                   </div>
                                 )}
                               </div>
                             );
                           })}
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
                                  <div key={index} className="bg-green-50 text-gray-700 rounded p-2 text-xs">
                                    <strong className="text-gray-700">{rec.medication}</strong> - {rec.dose} {rec.frequency} ({rec.evidenceLevel})
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

        {/* Agentic Clinical System */}
        <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">🤖 Advanced Agentic Clinical System</h2>
            <p className="text-blue-100 mb-4">
              Experience next-generation clinical decision making with multi-agent AI collaboration
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🧠</span>
                <h3 className="font-semibold">Multi-Agent Reasoning</h3>
              </div>
              <p className="text-sm text-blue-100">5 specialized AI agents collaborate for comprehensive analysis</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🔍</span>
                <h3 className="font-semibold">Dynamic Search</h3>
              </div>
              <p className="text-sm text-blue-100">Adaptive search strategies that evolve based on findings</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🔄</span>
                <h3 className="font-semibold">Iterative Refinement</h3>
              </div>
              <p className="text-sm text-blue-100">Continuous improvement through agent collaboration</p>
            </div>
          </div>
          
          <div className="text-center">
            <Link
              href="/agentic-clinical-test"
              className="inline-flex items-center bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span className="mr-2">🚀</span>
              Try Agentic Clinical System
            </Link>
          </div>
        </div>

        {isDevelopment && (
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
        )}

        {/* Therapeutic Guidelines Section */}
        {isDevelopment && (
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
              <Link
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
                href="/rag-performance-test"
              >
                Performance Test
              </Link>
            </div>
          </div>
        )}

        {isDevelopment && (
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
        )}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p className="text-sm text-gray-600">
          Heidi Medical AI Assignment - Proof of Concept
        </p>
      </footer>
    </div>
  );
}
