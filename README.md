# Heidi Medical AI Assignment

A Next.js application for uploading, storing, and searching Therapeutic Guidelines using Azure OpenAI embeddings and PostgreSQL with pgvector.

## 🚀 Features

- **Therapeutic Guidelines Upload**: Upload JSON files containing medical guideline chunks
- **Semantic Search**: Search guidelines using Azure OpenAI text-embedding-3-large
- **Vector Database**: Store embeddings in PostgreSQL with pgvector extension
- **Clinical Decision Support**: Comprehensive management plan generation with structured processing flow
- **Progress Tracking**: Real-time progress indicator with spinner animation during plan generation
- **Precise Dose Calculator**: Node.js-based medication dose calculations with pediatric safety checks
- **Optimized RAG Pipeline**: Only passes summary and highly relevant chunks to follow-up steps for efficiency
- **Modern UI**: Beautiful, responsive interface for uploading and viewing guidelines
- **Batch Processing**: Efficient processing of large guideline files
- **Real-time Search**: Instant semantic search results

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v12 or higher) with pgvector extension
3. **Azure OpenAI** account with text-embedding-3-large deployment

## 🛠️ Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd heidi_assignment
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Configuration
PGHOST=localhost
PGPORT=5432
PGDATABASE=heidi_medical_ai
PGUSER=postgres
PGPASSWORD=your_password

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your_chat_deployment_name
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=your_embedding_deployment_name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### 3. Database Setup

1. **Install pgvector extension**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Create database** (if not exists):
   ```sql
   CREATE DATABASE heidi_medical_ai;
   ```

3. **Run the application** - it will automatically create the required tables:
   ```bash
   npm run dev
   ```

## 📁 File Format

The application expects JSON files in the following format:

```json
[
  {
    "text": "Clinical guideline content here...",
    "metadata": {
      "header1": "Main section title",
      "header3": "Subsection title",
      "header4": "Sub-subsection title (optional)",
      "subchunk_id": 2,
      "source": "source-file.md",
      "chunk_id": 2,
      "reference": "Therapeutic Guidelines: Antibiotic. Section name",
      "length": 292
    }
  }
]
```

### Example File Structure

See `resources/tg.example.json` for a complete example with:
- Neonatal herpes simplex infection guidelines
- Clinical management flowcharts
- Proper metadata structure

## 🎯 How to Use

### 1. Test the System

Start by testing the embedding service:

1. Navigate to **Test Embeddings** (`/test-embeddings`)
2. Click "Test Embedding Service" to verify Azure OpenAI connection
3. Try generating an embedding with custom text

### 2. Upload Therapeutic Guidelines

1. Navigate to **Upload Guidelines** (`/upload-tg`)
2. **Drag and drop** or **click to select** your JSON file
3. **Preview** the first 3 items to verify content
4. **Choose options**:
   - ✅ Clear existing guidelines (optional)
5. Click **"Upload to Database"**
6. **Monitor progress** and view results

### 3. View and Search Guidelines

1. Navigate to **View Guidelines** (`/view-tg`)
2. **Browse all guidelines** or use the search function
3. **Search by content** using semantic similarity
4. **View detailed results** with metadata

### 4. Clinical Decision Support

1. Navigate to the **Home page** (`/`)
2. **Enter clinical transcript** or patient notes
3. **Submit for analysis** - the system will:
   - Extract patient data
   - Assess condition and severity
   - Retrieve relevant guidelines via RAG
   - Generate comprehensive management plan
   - Calculate precise drug doses using Node.js dose calculator
4. **Monitor progress** with real-time updates every 10 seconds:
   - Progress stages with visual indicators
   - Spinner animation during processing
   - Percentage completion bar
   - Dynamic button text showing current stage
5. **Review results** including confidence scores and evidence levels

### 5. Test Dose Calculator

1. Navigate to **Dose Calculator Test** (`/dose-calculator-test`)
2. **Enter medication parameters**:
   - Medication name
   - Patient weight and age
   - Dose per kg and units (from clinical guidelines)
   - Frequency and route
   - Maximum dose (optional)
3. **Calculate dose** to see:
   - Precise calculated dose
   - Dose range (±20% of calculated dose)
   - Pediatric safety warnings
   - Confidence score
   - Safety checks and recommendations

### 6. Guideline Links

The system automatically links relevant guidelines to their corresponding Therapeutic Guidelines web pages:

- **Automatic Mapping**: Source filenames (e.g., "Respiratory-Croup.md") are mapped to PDF files in the guideline database
- **Direct Links**: Click on guideline sources to access the full Therapeutic Guidelines web page
- **Topic Information**: Display shows topic (e.g., "Respiratory") and subtopic (e.g., "Croup") information
- **Relevance Filtering**: Only highly relevant guidelines (score ≥70) show clickable links
- **Visual Indicators**: ⭐ icon and green borders highlight the most relevant guidelines

## 🔍 RAG Pipeline Optimization

### Efficient Information Processing
The RAG (Retrieval-Augmented Generation) system has been optimized to reduce token usage and improve processing efficiency:

### Enhanced Severity Assessment
The system now retrieves clinical guidelines **before** determining severity to improve accuracy:

1. **Initial Condition Assessment**: Determine primary condition from clinical transcript
2. **Guideline Retrieval**: Get relevant guidelines based on condition (without severity)
3. **Enhanced Severity Assessment**: Use guideline criteria to determine severity more accurately
4. **Refined Guidelines**: Retrieve specific guidelines for the determined severity
5. **Evidence-Based Decisions**: Provide reasoning for severity determination based on guideline evidence

This approach ensures that severity assessment is based on evidence-based clinical criteria rather than just the LLM's interpretation of the transcript.

## 📊 Progress Tracking

### Real-time Clinical Plan Generation
The system provides comprehensive progress tracking during clinical management plan generation:

- **Visual Progress Indicator**: Spinner animation with progress stages
- **10-Second Updates**: Progress updates every 10 seconds during processing
- **Stage Tracking**: 7 distinct stages from data extraction to final recommendations
- **Percentage Completion**: Visual progress bar with percentage completion
- **Dynamic UI**: Button text updates to show current processing stage
- **Color-coded Status**: Green (completed), Blue (current), Gray (pending)

### Progress Stages
1. **Extracting patient data** - Parse clinical transcript for demographics and symptoms
2. **Analyzing clinical presentation** - Assess condition and severity
3. **Finding relevant therapeutic guidelines** - RAG retrieval from vector database
4. **Retrieving evidence-based recommendations** - Filter and rank guideline chunks
5. **Calculating medication dosages** - Precise dose calculations with safety checks
6. **Synthesizing management plan** - Generate comprehensive treatment plan
7. **Finalizing recommendations** - Complete with confidence scores and evidence levels

- **Essential Information Filtering**: All chunks with relevance score >0.7 are passed to follow-up steps
- **Quality Control**: Chunks with relevance scores >0.7 are prioritized
- **Summary Focus**: Synthesized information and final recommendations are emphasized
- **Reduced Token Usage**: Significantly fewer tokens sent to LLM for follow-up processing
- **Maintained Accuracy**: High-quality results with improved performance

### Processing Flow
1. **Retrieve**: Get relevant guideline chunks from vector database
2. **Filter**: Rank and filter chunks by relevance score
3. **Synthesize**: Create comprehensive summary and recommendations
4. **Extract**: Pass only essential information (summary + top chunks) to next steps
5. **Generate**: Create management plan and medication recommendations

## 💊 Dose Calculator

### Precise Medication Calculations
The system uses a Node.js-based dose calculator for accurate medication dosing instead of relying on LLM calculations:

- **Weight-based dosing**: dose per kg × patient weight (guidelines should already account for severity)
- **Unit conversions**: mg ↔ mcg ↔ g, ml ↔ l
- **Maximum dose enforcement**: Automatic capping with warnings
- **Pediatric safety checks**: Age and weight-based adjustments
- **High-risk medication detection**: Special monitoring for specific drugs

### Safety Features
- **Age warnings**: <3 months (extreme caution), <12 months (careful monitoring)
- **Weight adjustments**: <5kg (lower dose range), >50kg (adult dosing consideration)
- **Route-specific checks**: IV administration monitoring
- **Dose ranges**: ±20% of calculated dose with maximum limits

### Integration
- **LLM + Calculator**: LLM generates medication recommendations, calculator provides precise doses
- **Validation**: Comprehensive input validation and error handling
- **Confidence scoring**: Based on patient factors and safety warnings

## 🔍 Search Capabilities

### Semantic Search
- Uses Azure OpenAI text-embedding-3-large (1536 dimensions)
- Finds semantically similar content, not just exact matches
- Example queries:
  - "neonatal infection treatment"
  - "herpes simplex management"
  - "pediatric antiviral therapy"

### Search Results
Each result shows:
- **Content preview** (first 500 characters)
- **Header information** (section titles)
- **Metadata** (source, chunk ID, reference)
- **Similarity score** (vector distance)

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Next.js API    │    │   PostgreSQL    │
│   (React)       │◄──►│   Routes         │◄──►│   + pgvector    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Upload UI     │    │   Azure OpenAI   │    │   Vector Store  │
│   Search UI     │    │   Embeddings     │    │   (1536 dims)   │
│   Clinical UI   │    │   LLM Models     │    │   Guidelines    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Clinical Decision Support Flow

```
Clinical Transcript
        │
        ▼
┌─────────────────┐
│ 1. Extract      │ ← Patient demographics & history
│    Patient Data │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 2. Assess       │ ← Condition & severity
│    Condition    │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 3. RAG for      │ ← Retrieve relevant guidelines
│    Guidelines   │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 4. Generate     │ ← Comprehensive management plan
│    Management   │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 5. Calculate    │ ← Precise drug doses with safety checks
│    Drug Doses   │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 5. Calculate    │ ← Precise drug dosing
│    Drug Doses   │
└─────────────────┘
```

## 📊 Database Schema

### therapeutic_guidelines Table
```sql
CREATE TABLE therapeutic_guidelines (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Vector Index
```sql
CREATE INDEX therapeutic_guidelines_embedding_idx 
ON therapeutic_guidelines 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## 🚨 Troubleshooting

### Common Issues

1. **"Embedding service test failed"**
   - Check Azure OpenAI API key and endpoint
   - Verify embedding deployment name
   - Ensure API version is correct

2. **"Database initialization failed"**
   - Check PostgreSQL connection
   - Verify pgvector extension is installed
   - Check database credentials

3. **"Invalid JSON format"**
   - Ensure file is valid JSON array
   - Check required fields: `text` and `metadata`
   - Verify file structure matches example

4. **"Vector storage error"**
   - Check pgvector extension installation
   - Verify database permissions
   - Ensure embedding dimensions are 1536 or less

### Performance Tips

- **Batch Processing**: Files are processed in batches of 10 for efficiency
- **Index Optimization**: Vector index uses 100 lists for optimal performance
- **Memory Management**: Embeddings are truncated to 1536 dimensions for pgvector compatibility

## 🔧 API Endpoints

### Upload and Search
- `POST /api/upload-tg` - Upload therapeutic guidelines
- `GET /api/therapeutic-guidelines` - Get all guidelines
- `POST /api/therapeutic-guidelines` - Search guidelines

### Testing
- `GET /api/test-embeddings` - Test embedding service
- `POST /api/test-embeddings` - Generate test embedding
- `GET /api/test-vector-format` - Test vector format

## 📈 Monitoring

### Upload Progress
- Real-time progress tracking
- Success/failure counts
- Detailed error reporting
- Batch processing status

### Search Performance
- Response time monitoring
- Result count tracking
- Semantic similarity scores

## 🔒 Security Considerations

- **API Keys**: Store securely in environment variables
- **Database**: Use strong passwords and proper access controls
- **File Upload**: Validate JSON structure and content
- **Rate Limiting**: Consider implementing for production use

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
Ensure all environment variables are set in production:
- Database connection details
- Azure OpenAI credentials
- Proper security configurations

## 📝 License

This project is part of the Heidi Medical AI assignment.

## 🤝 Contributing

This is an assignment project. For questions or issues, please refer to the assignment guidelines.
