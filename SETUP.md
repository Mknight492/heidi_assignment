# Setup Instructions

## Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name

# ChromaDB Configuration (local)
CHROMA_DB_PATH=./chroma_db

# Application Configuration
NODE_ENV=development
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (see above)

3. Run the development server:
   ```bash
   npm run dev
   ```

## Dependencies Added

- **LangChain**: Core AI framework for LLM integration
- **Azure OpenAI**: For GPT model access via Azure
- **ChromaDB**: Local vector database for guideline storage
- **MathJS**: For medical calculations and dosing
- **Zod**: For data validation and type safety 