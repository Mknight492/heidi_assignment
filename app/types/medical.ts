// Medical AI Data Models
// Phase 2: Data Structure & Guidelines

export interface Patient {
  name: string;
  dob: Date;
  age: number;
  weight: number; // kg
  height?: number; // cm
  sex?: 'M' | 'F';
  presentingComplaint: string;
  history: string;
  examination: string;
  assessment: string;
}

export interface Guideline {
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  recommendations: string[];
  medicationDoses: MedicationDose[];
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  guidelineVersion: string;
  lastUpdated: Date;
  localRegion: string;
  source: string;
  content: string; // Full guideline text for vectorization
}

export interface MedicationDose {
  medication: string;
  dose: number;
  unit: string;
  frequency: string;
  route: string;
  rationale: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  confidence: number;
  safetyChecks: string[];
  minAge?: number; // months
  maxAge?: number; // months
  minWeight?: number; // kg
  maxWeight?: number; // kg
}

export interface DoseCalculation {
  medication: string;
  dose: number;
  unit: string;
  frequency: string;
  route: string;
  rationale: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  confidence: number;
  safetyChecks: string[];
  patientWeight: number;
  patientAge: number;
  calculatedDose: number;
  doseRange: {
    min: number;
    max: number;
  };
  warnings: string[];
}

export interface TranscriptInput {
  type: 'text' | 'file' | 'audio';
  content: string;
  fileName?: string;
  fileType?: string;
}

export interface ClinicalDecision {
  patient: Patient;
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  relevantGuidelines: Guideline[];
  medicationRecommendations: DoseCalculation[];
  managementPlan: string;
  confidence: number;
  evidenceSummary: string;
  warnings: string[];
  timestamp: Date;
}

export interface VectorizedGuideline {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    condition: string;
    severity: string;
    region: string;
    evidenceLevel: string;
    version: string;
    lastUpdated: Date;
  };
}

// New interface for Therapeutic Guidelines data structure
export interface TherapeuticGuidelineChunk {
  text: string;
  metadata: {
    header1?: string;
    header3?: string;
    header4?: string;
    subchunk_id: number;
    source: string;
    chunk_id: number;
    reference: string;
    length: number;
  };
}

export interface VectorizedTherapeuticGuideline {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    header1?: string;
    header3?: string;
    header4?: string;
    subchunk_id: number;
    source: string;
    chunk_id: number;
    reference: string;
    length: number;
  };
} 