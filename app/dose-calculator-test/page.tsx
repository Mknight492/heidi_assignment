'use client';

import { useState } from 'react';

interface DoseCalculationRequest {
  medication: string;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  dose: number;
  doseUnit: string;
  maxDose?: number;
  maxDoseUnit?: string;
  frequency: string;
  route: string;
  patientAge: number;
  patientWeight: number;
  condition?: string;
}

interface DoseCalculationResult {
  medication: string;
  calculatedDose: number;
  unit: string;
  frequency: string;
  route: string;
  doseRange: {
    min: number;
    max: number;
  };
  warnings: string[];
  safetyChecks: string[];
  confidence: number;
  rationale: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  patientWeight: number;
  patientAge: number;
}

export default function DoseCalculatorTest() {
  const [formData, setFormData] = useState<DoseCalculationRequest>({
    medication: 'Amoxicillin',
    weight: 20,
    weightUnit: 'kg',
    dose: 25,
    doseUnit: 'mg',
    maxDose: 1000,
    maxDoseUnit: 'mg',
    frequency: 'every 8 hours',
    route: 'oral',
    patientAge: 60, // 5 years in months
    patientWeight: 20,
    condition: 'Upper respiratory tract infection'
  });

  const [result, setResult] = useState<DoseCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof DoseCalculationRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/dose-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate dose');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Medication Dose Calculator Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Dose Calculation Parameters</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Medication</label>
              <input
                type="text"
                value={formData.medication}
                onChange={(e) => handleInputChange('medication', e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Weight</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                  className="w-full p-2 border rounded"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight Unit</label>
                <select
                  value={formData.weightUnit}
                  onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dose per kg</label>
                <input
                  type="number"
                  value={formData.dose}
                  onChange={(e) => handleInputChange('dose', parseFloat(e.target.value))}
                  className="w-full p-2 border rounded"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dose Unit</label>
                <input
                  type="text"
                  value={formData.doseUnit}
                  onChange={(e) => handleInputChange('doseUnit', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="mg, mcg, g, ml"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Dose (optional)</label>
                <input
                  type="number"
                  value={formData.maxDose || ''}
                  onChange={(e) => handleInputChange('maxDose', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full p-2 border rounded"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Dose Unit</label>
                <input
                  type="text"
                  value={formData.maxDoseUnit || ''}
                  onChange={(e) => handleInputChange('maxDoseUnit', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="mg, mcg, g, ml"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="every 8 hours"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Route</label>
                <input
                  type="text"
                  value={formData.route}
                  onChange={(e) => handleInputChange('route', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="oral, IV, IM"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient Age (months)</label>
                <input
                  type="number"
                  value={formData.patientAge}
                  onChange={(e) => handleInputChange('patientAge', parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Patient Weight (kg)</label>
                <input
                  type="number"
                  value={formData.patientWeight}
                  onChange={(e) => handleInputChange('patientWeight', parseFloat(e.target.value))}
                  className="w-full p-2 border rounded"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Condition (optional)</label>
              <input
                type="text"
                value={formData.condition || ''}
                onChange={(e) => handleInputChange('condition', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Calculating...' : 'Calculate Dose'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Calculation Results</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{result.medication}</h3>
                <div className="text-2xl font-bold text-green-600">
                  {result.calculatedDose} {result.unit}
                </div>
                <div className="text-sm text-gray-600">
                  {result.frequency} • {result.route}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Dose Range</h4>
                <div className="text-sm">
                  {result.doseRange.min} - {result.doseRange.max} {result.unit}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Rationale</h4>
                <div className="text-sm text-gray-700">{result.rationale}</div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Confidence</h4>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{result.confidence}%</span>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-orange-600">Warnings</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {result.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.safetyChecks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600">Safety Checks</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {result.safetyChecks.map((check, index) => (
                      <li key={index}>• {check}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Evidence Level: {result.evidenceLevel} • 
                Patient: {result.patientAge} months, {result.patientWeight} kg
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 