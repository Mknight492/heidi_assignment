# Improved Plan for Heidi Medical AI Assignment

## Overview
Build a clinical decision support system that ingests clinical text, queries guidelines via RAG, calculates medication doses, and returns evidence-based recommendations.

## Phase 1: Foundation & Setup (2-3 hours)
- ✅ **Frontend + Backend with CICD** - done
- ✅ **Basic Next.js setup** - done
- ✅ **Add LangChain dependencies** - `langchain`, `@langchain/openai`, `@langchain/community`
- ✅ **Migrate to new Azure OpenAI integration** - Updated from deprecated `@langchain/azure-openai` to `@langchain/openai`
- **Add vector database** - `@pinecone-database/pinecone` or `chromadb` for local development
- **Add medical calculation libraries** - `medical-calculator` or custom dose calculation logic
- **Environment setup** - `.env.local` for API keys

## Phase 2: Data Structure & Guidelines (2-3 hours)
- **Create patient data model**:
  ```typescript
  interface Patient {
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
  ```
- **Create guideline data structure**:
  ```typescript
  interface Guideline {
    condition: string;
    severity: 'mild' | 'moderate' | 'severe';
    recommendations: string[];
    medicationDoses: MedicationDose[];
    evidenceLevel: 'A' | 'B' | 'C' | 'D';
    guidelineVersion: string;
    lastUpdated: Date;
    localRegion: string;
    source: string;
  }
  ```
- **Add local croup guidelines** to vector database (multiple regions)
- **Create dose calculation interface**:
  ```typescript
  interface DoseCalculation {
    medication: string;
    dose: number;
    unit: string;
    frequency: string;
    route: string;
    rationale: string;
    evidenceLevel: 'A' | 'B' | 'C' | 'D';
    confidence: number;
    safetyChecks: string[];
  }
  ```
- **Add transcript processing support**:
  ```typescript
  interface TranscriptInput {
    type: 'text' | 'file' | 'audio';
    content: string;
    fileName?: string;
    fileType?: string;
  }
  ```

## Phase 3: Core AI Components (3-4 hours)
- **Unified processing pipeline**:
  - Extract patient demographics from clinical text/transcript
  - Parse presenting complaint, history, examination
  - Determine condition severity
  - Query vector database for relevant local guidelines
  - Calculate weight-based medication doses with evidence levels
  - Generate comprehensive decision support plan
- **RAG implementation**:
  - Vectorize local clinical guidelines with metadata
  - Implement semantic search for relevant guidelines
  - Context retrieval for decision support
  - Evidence level assessment and confidence scoring
- **Dose calculation function**:
  - Implement weight-based prednisone/dexamethasone calculator
  - Add safety checks and age-appropriate dosing
  - Include pediatric dosing guidelines
  - Evidence-based dosing recommendations
- **Transcript processing**:
  - File parsing (PDF, DOCX, TXT)
  - Audio transcription (optional)
  - Text extraction and normalization

## Phase 4: API Development (2-3 hours)
- **Create single clinical decision API** (`/api/clinical-decision`):
  - Accept clinical text/transcript input (multiple formats)
  - Extract patient data and condition
  - Query vector database for relevant local guidelines
  - Calculate weight-based medication doses with evidence levels
  - Generate comprehensive decision support plan
  - Return all results in single response with confidence scores
- **Add file upload support**:
  - Handle TXT input

## Phase 5: Frontend Interface (2-3 hours)
- **Multi-format input support**:
  - Text area for clinical notes
  - File upload for transcripts (PDF, DOCX, TXT)
  - Audio file upload with transcription (optional)
  - Patient demographics form
- **Real-time processing indicators**:
  - Progress bar for processing steps
  - Status updates during analysis
- **Results display**:
  - Structured decision support plan
  - Medication dosing recommendations with evidence levels
  - Guideline references with version/date
  - Confidence scores and evidence strength
  - Local guideline compliance indicators
- **Test cases interface**:
  - Pre-loaded test cases (different weights, ages)
  - Side-by-side comparison view
  - Guideline variation testing

## Phase 6: Testing & Validation (1-2 hours)
- **Multiple test scenarios**:
  - Different patient weights (10kg, 15kg, 20kg)
  - Different ages (1 year, 3 years, 5 years)
  - Different severity levels
  - Different local guideline regions
- **Input format testing**:
  - Clinical text input
  - PDF transcript upload
  - DOCX transcript upload
  - Audio file upload (if implemented)
- **Edge case handling**:
  - Missing weight data
  - Age-appropriate dosing limits
  - Allergy considerations
  - Outdated guidelines
  - Regional guideline variations
- **Performance testing**:
  - Response times (target < 10 seconds)
  - Accuracy validation
  - Real-time processing indicators

## Phase 7: Documentation & Deployment (1-2 hours)
- **Architecture diagram** (Excalidraw):
  - Component flow
  - API interactions
  - Data flow
- **Walk-through video**:
  - Demo with multiple test cases
  - Technical decisions explanation
  - Known limitations

## Technical Stack
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Vector DB**: ChromaDB (local) or Pinecone (cloud)
- **LLM**: OpenAI GPT-4 for reasoning, GPT-3.5 for simple tasks
- **Dose Calculator**: Custom implementation with medical validation
- **Deployment**: Vercel for easy hosting

## Key Features
- Real-time clinical decision support
- Evidence-based guideline recommendations
- Weight-based medication dosing
- Pediatric-specific considerations
- Multiple test case support
- Comprehensive error handling

## Success Criteria
- ✅ Accepts clinical text input
- ✅ Queries and retrieves relevant guidelines
- ✅ Calculates appropriate medication doses
- ✅ Returns detailed management plan
- ✅ Works with multiple test cases
- ✅ Deployed and accessible
- ✅ Documentation complete
- ✅ Guideline source linking to web pages

## Additional Features Implemented
- ✅ **Guideline Source Linking**: Links guideline sources to appropriate web pages using PDF-to-links mapping
  - Direct filename matching with fallback to partial matching
  - Topic and subtopic information display
  - Clickable links in management plan interface
  - Graceful fallback for guidelines without available links 