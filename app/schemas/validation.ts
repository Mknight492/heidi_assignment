import { z } from 'zod';

// Patient validation schema
export const PatientSchema = z.object({
  name: z.string().min(1, 'Patient name is required'),
  dob: z.date(),
  age: z.number().min(0).max(120, 'Age must be between 0 and 120'),
  weight: z.number().min(0.1).max(500, 'Weight must be between 0.1 and 500 kg'),
  height: z.number().min(10).max(300).optional(), // cm
  sex: z.enum(['M', 'F']).optional(),
  presentingComplaint: z.string().min(1, 'Presenting complaint is required'),
  history: z.string().min(1, 'History is required'),
  examination: z.string().min(1, 'Examination is required'),
  assessment: z.string().min(1, 'Assessment is required'),
});

// Guideline validation schema
export const GuidelineSchema = z.object({
  condition: z.string().min(1, 'Condition is required'),
  severity: z.enum(['mild', 'moderate', 'severe']),
  recommendations: z.array(z.string()).min(1, 'At least one recommendation is required'),
  medicationDoses: z.array(z.object({
    medication: z.string().min(1),
    dose: z.number().positive(),
    unit: z.string().min(1),
    frequency: z.string().min(1),
    route: z.string().min(1),
    rationale: z.string().min(1),
    evidenceLevel: z.enum(['A', 'B', 'C', 'D']),
    confidence: z.number().min(0).max(1),
    safetyChecks: z.array(z.string()),
    minAge: z.number().optional(),
    maxAge: z.number().optional(),
    minWeight: z.number().optional(),
    maxWeight: z.number().optional(),
  })),
  evidenceLevel: z.enum(['A', 'B', 'C', 'D']),
  guidelineVersion: z.string().min(1),
  lastUpdated: z.date(),
  localRegion: z.string().min(1),
  source: z.string().min(1),
  content: z.string().min(1, 'Guideline content is required'),
});

// Dose calculation validation schema
export const DoseCalculationSchema = z.object({
  medication: z.string().min(1),
  dose: z.number().positive(),
  unit: z.string().min(1),
  frequency: z.string().min(1),
  route: z.string().min(1),
  rationale: z.string().min(1),
  evidenceLevel: z.enum(['A', 'B', 'C', 'D']),
  confidence: z.number().min(0).max(1),
  safetyChecks: z.array(z.string()),
  patientWeight: z.number().positive(),
  patientAge: z.number().min(0),
  calculatedDose: z.number().positive(),
  doseRange: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
  }),
  warnings: z.array(z.string()),
});

// Transcript input validation schema
export const TranscriptInputSchema = z.object({
  type: z.enum(['text', 'file', 'audio']),
  content: z.string().min(1, 'Content is required'),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
});

// Clinical decision validation schema
export const ClinicalDecisionSchema = z.object({
  patient: PatientSchema,
  condition: z.string().min(1),
  severity: z.enum(['mild', 'moderate', 'severe']),
  relevantGuidelines: z.array(GuidelineSchema),
  medicationRecommendations: z.array(DoseCalculationSchema),
  managementPlan: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidenceSummary: z.string().min(1),
  warnings: z.array(z.string()),
  timestamp: z.date(),
});

// Vectorized guideline validation schema
export const VectorizedGuidelineSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1),
  embedding: z.array(z.number()),
  metadata: z.object({
    condition: z.string().min(1),
    severity: z.string().min(1),
    region: z.string().min(1),
    evidenceLevel: z.string().min(1),
    version: z.string().min(1),
    lastUpdated: z.date(),
  }),
});

// API request validation schemas
export const ClinicalDecisionRequestSchema = z.object({
  transcript: TranscriptInputSchema,
  patientData: PatientSchema.partial().optional(),
});

export const GuidelineSearchRequestSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  condition: z.string().optional(),
  region: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
}); 