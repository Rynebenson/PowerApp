# Chatbot Management System

## Overview
Organizations can create, configure, and deploy AI-powered chatbots that can be embedded on their websites. Each chatbot supports RAG (Retrieval-Augmented Generation) with custom context, documents, and knowledge bases.

## Core Features
1. **Chatbot CRUD** - Create, read, update, delete chatbots per org
2. **Model Selection** - Toggle between different AI models (Claude, Llama, etc.)
3. **Context Management** - Upload documents, add notes, URLs, and custom instructions
4. **Embed Generation** - Generate script tags for website embedding
5. **Preview Mode** - Test chatbots within the app before deployment
6. **RAG Pipeline** - Document processing and semantic search for accurate responses

## Tech Stack

### Frontend
- **Next.js 16 + React 19** - Existing stack
- **Tailwind + Radix UI** - Chatbot widget UI components
- **React Markdown** - Render chatbot responses with formatting

### Backend (AWS Lambda)
- **LangChain JS** - Agent orchestration and RAG pipeline
- **AWS Bedrock** - Claude 3.5 Haiku for chat (fast, cheap, excellent quality)
- **AWS Bedrock Embeddings** - amazon.titan-embed-text-v2 for vectors

### Vector Database
- **AWS OpenSearch Serverless** - Fully managed, AWS-native vector search
  - k-NN plugin for semantic search
  - Integrated with IAM
  - No external dependencies
  - Pay only for what you use

### Document Processing
- **LangChain Document Loaders** - PDF, DOCX, TXT, CSV parsing
- **AWS Bedrock Titan Embeddings** - 1024 dimensions, $0.0001/1K tokens
- **RecursiveCharacterTextSplitter** - Chunk documents for embedding

### Storage
- **DynamoDB** - Chatbot metadata, configuration, messages
- **S3** - Document storage (PDFs, files uploaded by orgs)

## Data Model

### Entities (`lib/entities/chatbot.ts`)
```typescript
interface Chatbot {
  id: string;                    // Unique chatbot ID
  orgId: string;                 // Organization owner
  name: string;                  // Display name
  description?: string;          // Internal description
  systemPrompt: string;          // Base instructions for the bot
  model: BedrockModel;           // Selected AI model
  temperature: number;           // 0-1, creativity level
  maxTokens: number;             // Response length limit
  status: 'active' | 'inactive'; // Enable/disable
  embedCode: string;             // Generated script tag
  createdAt: string;
  updatedAt: string;
}

type BedrockModel = 
  | 'claude-3-5-haiku'    // Fast, cheap, great for most use cases [FREE]
  | 'claude-3-5-sonnet'   // Balanced, best quality/cost ratio [PREMIUM]
  | 'claude-3-opus'       // Most capable, expensive [PREMIUM]
  | 'llama-3-70b'         // Open source, good performance [PREMIUM]
  | 'llama-3-8b';         // Fastest, cheapest [FREE]

// Model configuration for backend
const BEDROCK_MODELS: Record<BedrockModel, {
  id: string;
  name: string;
  description: string;
  inputCost: number;   // per 1K tokens
  outputCost: number;  // per 1K tokens
  maxTokens: number;
  provider: 'anthropic' | 'meta';
  tier: 'free' | 'premium';  // Access control
}> = {
  'llama-3-8b': {
    id: 'meta.llama3-8b-instruct-v1:0',
    name: 'Llama 3 8B',
    description: 'Fastest and cheapest option',
    inputCost: 0.0003,
    outputCost: 0.0006,
    maxTokens: 2048,
    provider: 'meta',
    tier: 'free',  // ✅ Available to all users
  },
  'claude-3-5-haiku': {
    id: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    name: 'Claude 3.5 Haiku',
    description: 'Fast and affordable, great for customer support',
    inputCost: 0.001,
    outputCost: 0.005,
    maxTokens: 8000,
    provider: 'anthropic',
    tier: 'free',  // ✅ Available to all users
  },
  'llama-3-70b': {
    id: 'meta.llama3-70b-instruct-v1:0',
    name: 'Llama 3 70B',
    description: 'Open source, strong performance',
    inputCost: 0.00099,
    outputCost: 0.00099,
    maxTokens: 2048,
    provider: 'meta',
    tier: 'premium',  // 🔒 Locked - upgrade required
  },
  'claude-3-5-sonnet': {
    id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    name: 'Claude 3.5 Sonnet',
    description: 'Best balance of intelligence and speed',
    inputCost: 0.003,
    outputCost: 0.015,
    maxTokens: 8000,
    provider: 'anthropic',
    tier: 'premium',  // 🔒 Locked - upgrade required
  },
  'claude-3-opus': {
    id: 'anthropic.claude-3-opus-20240229-v1:0',
    name: 'Claude 3 Opus',
    description: 'Most capable, for complex reasoning tasks',
    inputCost: 0.015,
    outputCost: 0.075,
    maxTokens: 4096,
    provider: 'anthropic',
    tier: 'premium',  // 🔒 Locked - upgrade required
  },
};

interface ChatbotContext {
  id: string;
  chatbotId: string;
  type: 'document' | 'note' | 'url';
  content: string;               // Text content or S3 key
  metadata: {
    filename?: string;
    url?: string;
    title?: string;
    vectorIds?: string[];        // OpenSearch document IDs
  };
  createdAt: string;
}

interface ChatMessage {
  id: string;
  chatbotId: string;
  sessionId: string;             // Group messages by session
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### DynamoDB Keys
```
Chatbot:
  pk: ORG#${orgId}
  sk: CHATBOT#${chatbotId}
  gsi1pk: CHATBOT#${chatbotId}
  gsi1sk: METADATA

ChatbotContext:
  pk: CHATBOT#${chatbotId}
  sk: CONTEXT#${contextId}

ChatMessage:
  pk: CHATBOT#${chatbotId}#SESSION#${sessionId}
  sk: MESSAGE#${timestamp}
  ttl: 30 days (optional, for cleanup)
```

## API Endpoints

### Chatbot Management (Authenticated)
```
POST   /chatbots/create          - Create new chatbot
GET    /chatbots/list            - List org's chatbots
GET    /chatbots/details         - Get chatbot config
PUT    /chatbots/update          - Update chatbot settings
DELETE /chatbots/delete          - Delete chatbot
POST   /chatbots/toggle          - Activate/deactivate
```

### Context Management (Authenticated)
```
POST   /chatbots/context/upload  - Upload document (multipart)
POST   /chatbots/context/note    - Add text note
POST   /chatbots/context/url     - Add URL reference
GET    /chatbots/context/list    - List all context items
DELETE /chatbots/context/delete  - Remove context item
```

### Chat Interface (Public, No Auth)
```
POST   /chat/${chatbotId}        - Send message, get response
GET    /chat/${chatbotId}/config - Get public chatbot config (name, styling)
```

## RAG Pipeline Flow

### 1. Document Ingestion
```
User uploads PDF → S3 → Lambda trigger → 
  LangChain loader → Split into chunks → 
  Bedrock Titan embeddings → Store in OpenSearch → 
  Save metadata to DynamoDB
```

### 2. Chat Query
```
User message → Lambda → 
  Bedrock Titan embedding → 
  OpenSearch k-NN search (top 5 chunks) → 
  LangChain prompt with context → 
  Bedrock Claude generates response → 
  Return to user
```

### 3. LangChain Agent Setup
```typescript
// Simplified agent structure
const embeddings = new BedrockEmbeddings({
  model: "amazon.titan-embed-text-v2:0",
  region: "us-east-1",
});

const vectorStore = new OpenSearchVectorSearch(embeddings, {
  client: opensearchClient,
  indexName: `chatbot-${chatbotId}`,
});

const retriever = vectorStore.asRetriever({ k: 5 });

// Get model config from chatbot settings
const modelConfig = BEDROCK_MODELS[chatbot.model];

const model = new BedrockChat({
  model: modelConfig.id,
  region: "us-east-1",
  modelKwargs: {
    temperature: chatbot.temperature,
    max_tokens: Math.min(chatbot.maxTokens, modelConfig.maxTokens),
  },
});

const chain = ConversationalRetrievalQAChain.fromLLM(
  model,
  retriever,
  {
    returnSourceDocuments: true,
  }
);
```

## Embed Widget

### Generated Script Tag
```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://powerapp.rynebenson.com/widget.js';
    script.setAttribute('data-chatbot-id', 'CHATBOT_ID');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

### Widget Features
- Floating button (bottom-right corner)
- Expandable chat window
- Message history
- Typing indicators
- Mobile responsive
- Customizable colors (future: per chatbot)

### Widget Implementation
- **Static file**: `public/widget.js` - Standalone JS bundle
- **Iframe approach**: Isolated styles, secure
- **PostMessage API**: Communication between widget and parent site

## Frontend Pages

### Dashboard
- `/dashboard/chatbots` - List all chatbots with status and model
- `/dashboard/chatbots/new` - Create chatbot form with model selector
- `/dashboard/chatbots/[id]` - Edit chatbot settings (including model toggle)
- `/dashboard/chatbots/[id]/context` - Manage documents/notes
- `/dashboard/chatbots/[id]/preview` - Test chatbot with current model
- `/dashboard/chatbots/[id]/embed` - Get embed code
- `/dashboard/chatbots/[id]/analytics` - Message history (future)

### Model Selection UI
Settings page should include:
- **Model Dropdown** - Shows ALL models, but premium ones are disabled with lock icon
- **Model Info Card** - Show description, cost per 1K tokens, speed, tier badge
- **Tier Badge** - "FREE" (green) or "PREMIUM" (gold with lock icon)
- **Upgrade CTA** - "Upgrade to unlock" button on premium models
- **Cost Estimator** - Estimate monthly cost based on expected usage
- **Performance Badge** - Visual indicator (Fast/Balanced/Powerful)
- **Test Button** - Send test message to compare models (free tier only)

### Freemium Model Strategy
**Free Tier (Default):**
- ✅ Llama 3 8B - Fastest, cheapest
- ✅ Claude 3.5 Haiku - Best free option, default
- ✅ Unlimited chatbots
- ✅ All RAG features

**Premium Tier (Future Monetization):**
- 🔒 Llama 3 70B - Better reasoning
- 🔒 Claude 3.5 Sonnet - Superior quality
- 🔒 Claude 3 Opus - Most capable
- 🔒 Priority support
- 🔒 Custom branding
- 🔒 Advanced analytics

## Implementation Phases

### Phase 1: Core Infrastructure
1. Add Chatbot entities to `lib/entities/`
2. Create DynamoDB helpers in `lib/dynamo/chatbots.ts`
3. Set up OpenAI API secret in SST
4. Create basic CRUD endpoints

### Phase 2: RAG Pipeline
1. Set up OpenSearch Serverless collection in SST
2. Add S3 bucket for document storage
3. Enable Bedrock model access (Claude 3.5 Haiku + Titan Embeddings)
4. Implement document upload endpoint
5. Build embedding generation Lambda
6. Create chat endpoint with retrieval

### Phase 3: Frontend UI
1. Chatbot list and creation forms
2. Context management interface
3. Preview chat component
4. Embed code generator

### Phase 4: Widget
1. Build standalone widget.js
2. Implement iframe embedding
3. Style and responsive design
4. Deploy to CDN (CloudFront)

## Environment Variables

### Lambda Environment (No secrets needed!)
```typescript
environment: {
  OPENSEARCH_ENDPOINT: opensearchCollection.endpoint,
  DOCUMENTS_BUCKET: documentsBucket.name,
  AWS_REGION: aws.getRegionOutput().name,
}

// Bedrock access via IAM role - no API keys!
```

## Cost Estimates (Monthly)

### Low Usage (10 chatbots, 1K messages/month)
**Using Claude 3.5 Haiku (default):**
- Bedrock Claude 3.5 Haiku: ~$1 (1K msgs × 1K tokens × $0.001/1K)
- Bedrock Titan Embeddings: ~$0.50 (5K embeddings)
- OpenSearch Serverless: ~$90 (minimum OCU charge)
- AWS Lambda: ~$1
- S3: <$1
- DynamoDB: Free tier
- **Total: ~$93/month**

**Using Llama 3 8B (cheapest):**
- Bedrock Llama 3 8B: ~$0.30
- Other costs: ~$92
- **Total: ~$92/month**

### Medium Usage (50 chatbots, 10K messages/month)
**Using Claude 3.5 Haiku:**
- Bedrock Claude 3.5 Haiku: ~$10
- Other costs: ~$205
- **Total: ~$215/month**

**Using Claude 3.5 Sonnet (better quality):**
- Bedrock Claude 3.5 Sonnet: ~$30
- Other costs: ~$205
- **Total: ~$235/month**

**Using Llama 3 70B (open source):**
- Bedrock Llama 3 70B: ~$10
- Other costs: ~$205
- **Total: ~$215/month**

**Model Cost Comparison (per 1M tokens):**
- Llama 3 8B: $0.30 input / $0.60 output
- Claude 3.5 Haiku: $1 input / $5 output
- Llama 3 70B: $0.99 input / $0.99 output
- Claude 3.5 Sonnet: $3 input / $15 output
- Claude 3 Opus: $15 input / $75 output

**Note**: OpenSearch Serverless has minimum costs (~$700/month for production) but offers a free tier for development. For production, consider OpenSearch provisioned cluster (~$50/month for t3.small) if cost is a concern.

## Security Considerations

1. **Public Chat Endpoint** - Rate limiting per IP/session
2. **Document Access** - S3 presigned URLs, org-scoped
3. **IAM Roles** - Lambda execution role with least privilege
4. **OpenSearch Access** - VPC endpoints or data access policies
5. **CORS** - Whitelist domains (future: per chatbot)
6. **Input Validation** - Sanitize user messages
7. **Cost Protection** - Token limits per chatbot

## Model Selection Benefits

### For Organizations
1. **Cost Control** - Choose between two free models based on needs
2. **Transparency** - See exact costs per model in the UI
3. **Upgrade Path** - View premium models to understand value proposition
4. **No Lock-in** - Switch between free models anytime

### For Your Business (Monetization)
1. **Freemium Hook** - Users see premium models but can't use them
2. **Value Demonstration** - Show cost/performance differences clearly
3. **Upgrade Incentive** - "Unlock Claude 3.5 Sonnet for better responses"
4. **Tiered Pricing** - Future: $29/mo for premium models, $99/mo for enterprise

### Recommended Use Cases
**Free Tier Models:**
- **Llama 3 8B** ✅ - FAQ bots, simple product info, high volume
- **Claude 3.5 Haiku** ✅ - Customer support, general queries (default)

**Premium Models (Locked):**
- **Llama 3 70B** 🔒 - Technical support, detailed explanations
- **Claude 3.5 Sonnet** 🔒 - Complex reasoning, sales conversations
- **Claude 3 Opus** 🔒 - Legal/financial advice, critical accuracy needs

## Backend Validation

```typescript
// In chatbot update endpoint
function validateModelAccess(model: BedrockModel, orgTier: 'free' | 'premium'): boolean {
  const modelConfig = BEDROCK_MODELS[model];
  
  if (modelConfig.tier === 'premium' && orgTier === 'free') {
    throw new Error('Premium model requires upgrade. Please upgrade your plan.');
  }
  
  return true;
}
```

## Future Enhancements

- **Subscription Management** - Stripe integration for premium upgrades
- **Usage Limits** - Free tier: 1K msgs/month, Premium: unlimited
- **Auto Model Selection** - AI picks best model based on query complexity (premium)
- **Model Fallback** - Switch to cheaper model if context is simple
- **Analytics Dashboard** - Message volume, user satisfaction, cost per model
- **Custom Branding** - Widget colors, logo per chatbot (premium)
- **Multi-language** - Detect and respond in user's language
- **Voice Input** - Speech-to-text integration (premium)
- **Human Handoff** - Escalate to support team (premium)
- **A/B Testing** - Test different prompts/models automatically (premium)
- **Fine-tuning** - Custom models per org (enterprise)

## Pre-built Agents to Explore

### LangChain Templates
- **RAG Conversation** - Basic Q&A with memory
- **SQL Agent** - Query databases (future: connect to customer DBs)
- **Web Search Agent** - Real-time info retrieval
- **Multi-document Agent** - Compare across documents

### LangGraph Patterns
- **Supervisor Agent** - Route queries to specialized sub-agents
- **ReAct Agent** - Reasoning + Acting for complex queries
- **Plan-and-Execute** - Break down complex questions

**Recommendation**: Start with simple ConversationalRetrievalQA chain, then upgrade to LangGraph for multi-step reasoning if needed.

## AWS Infrastructure (SST)

### OpenSearch Serverless Collection
```typescript
// In sst.config.ts
const opensearchCollection = new aws.opensearchserverless.Collection("VectorStore", {
  name: `powerapp-vectors-${$app.stage}`,
  type: "VECTORSEARCH",
});

const dataAccessPolicy = new aws.opensearchserverless.AccessPolicy("DataAccess", {
  name: `powerapp-data-${$app.stage}`,
  type: "data",
  policy: JSON.stringify([{
    Rules: [{
      ResourceType: "collection",
      Resource: [`collection/${opensearchCollection.name}`],
      Permission: ["aoss:*"],
    }, {
      ResourceType: "index",
      Resource: [`index/${opensearchCollection.name}/*`],
      Permission: ["aoss:*"],
    }],
    Principal: [lambdaRole.arn],
  }]),
});
```

### S3 Document Bucket
```typescript
const documentsBucket = new sst.aws.Bucket("ChatbotDocuments", {
  transform: {
    bucket: {
      lifecycleRules: [{
        enabled: true,
        expiration: { days: 365 }, // Optional: cleanup old docs
      }],
    },
  },
});
```

### Lambda IAM Permissions
```typescript
// Add to Lambda functions that need Bedrock
const bedrockPolicy = new aws.iam.RolePolicy("BedrockAccess", {
  role: lambdaRole.name,
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Action: [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
      ],
      Resource: [
        // Claude models
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0",
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-opus-20240229-v1:0",
        // Llama models
        "arn:aws:bedrock:*::foundation-model/meta.llama3-70b-instruct-v1:0",
        "arn:aws:bedrock:*::foundation-model/meta.llama3-8b-instruct-v1:0",
        // Embeddings
        "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0",
      ],
    }],
  }),
});
```

## Development Workflow

1. **Local Testing**: Use `npx sst dev` with ngrok for widget testing
2. **Document Processing**: Test with sample PDFs (contracts, FAQs)
3. **Preview Mode**: Build in-app chat before widget
4. **Staging**: Deploy to development stage for client demos
5. **Production**: Deploy to main with monitoring

## Success Metrics

- **Time to Create**: <5 minutes to create and deploy a chatbot
- **Response Quality**: Accurate answers from uploaded documents
- **Performance**: <2s response time for chat queries
- **Ease of Embed**: Copy-paste script tag, works immediately
- **Mobile UX**: Responsive widget on all devices
- **Conversion Rate**: % of users who view premium models and upgrade
- **Model Distribution**: Track which free models are most popular

---

**Next Steps**: Review this architecture, then start with Phase 1 (Core Infrastructure) to build the foundation.
