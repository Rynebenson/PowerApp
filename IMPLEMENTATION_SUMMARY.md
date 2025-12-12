# OpenAI + OpenSearch RAG Implementation Summary

## What We Built

A complete RAG (Retrieval-Augmented Generation) chatbot system using:
- **OpenAI** for embeddings (text-embedding-ada-002) and chat (gpt-4o-mini)
- **OpenSearch** for vector storage and semantic search
- **AWS Lambda** for serverless processing
- **S3** for document storage

## Architecture

```
User uploads PDF → S3 → Lambda Processor → OpenAI Embeddings → OpenSearch
                                                                      ↓
User asks question → Chat API → OpenAI Embeddings → OpenSearch Search → OpenAI Chat → Response
```

## Files Created/Modified

### Backend Functions

1. **`backend/functions/documents/process.ts`**
   - Triggered when files are uploaded to S3
   - Extracts text from PDFs using pdf-parse
   - Splits text into chunks (1000 chars, 200 overlap)
   - Creates embeddings with OpenAI
   - Stores vectors in OpenSearch with k-NN index
   - Updates DynamoDB with vector IDs

2. **`backend/functions/chatbots/chat.ts`**
   - Public endpoint (no auth required for widget)
   - Receives user message
   - Creates embedding for the query
   - Searches OpenSearch for top 5 relevant chunks
   - Builds prompt with context + system prompt
   - Calls OpenAI GPT-4o-mini for response
   - Returns formatted answer

3. **`backend/functions/chatbots/context.ts`** (updated)
   - Fixed S3 key format: `chatbots/{chatbotId}/context/{contextId}/{filename}`
   - Generates presigned URLs for file uploads
   - Stores metadata in DynamoDB

### Infrastructure (`sst.config.ts`)

Added:
- `OpenAIApiKey` secret
- `VectorSearch` OpenSearch cluster (t3.small.search, 10GB)
- Document processor S3 trigger
- Chat endpoint (public, no auth)
- Linked OpenAI secret to all relevant functions

### Frontend

- **ChatPreview component**: Already configured to use `/chat/{chatbotId}`
- **Widget.js**: Already configured to use `/chat/{chatbotId}`
- **Chatbot detail page**: File upload UI ready

## How to Test

### 1. Wait for OpenSearch to Deploy (~10-15 mins)
```bash
npx sst dev
```

### 2. Create a Chatbot
- Go to `/chatbots`
- Click "Create Chatbot"
- Fill in name, description, model
- Click "Create"

### 3. Upload a Document
- Go to chatbot detail page
- Click "Upload Document"
- Select a PDF file
- Wait for processing (check Lambda logs)

### 4. Test Chat
**Option A: Preview in App**
- Click "Preview Chat" button
- Ask questions about your document

**Option B: Widget on Website**
- Copy embed code from chatbot detail page
- Paste into your website
- Or use `/widget-test.html` for testing

### 5. Verify RAG Pipeline
Check that:
- ✅ PDF text is extracted
- ✅ Chunks are created
- ✅ Embeddings are generated
- ✅ Vectors are stored in OpenSearch
- ✅ Chat retrieves relevant context
- ✅ Responses reference uploaded content

## OpenSearch Index Structure

Each chatbot gets its own index: `chatbot-{chatbotId}`

```json
{
  "mappings": {
    "properties": {
      "text": { "type": "text" },
      "embedding": {
        "type": "knn_vector",
        "dimension": 1536
      },
      "contextId": { "type": "keyword" },
      "chatbotId": { "type": "keyword" }
    }
  },
  "settings": {
    "index.knn": true
  }
}
```

## Cost Estimates

### OpenAI (per 1K messages)
- Embeddings: ~$0.10 (1K queries × $0.0001/1K tokens)
- Chat: ~$1.50 (1K responses × $0.0015/1K tokens for gpt-4o-mini)
- **Total: ~$1.60/1K messages**

### AWS OpenSearch
- t3.small.search: ~$50/month (minimum)
- 10GB storage: ~$1/month
- **Total: ~$51/month**

### AWS Lambda
- Document processing: ~$0.20/1K documents
- Chat requests: ~$0.10/1K messages
- **Total: ~$0.30/1K operations**

### Grand Total
- **Fixed**: ~$51/month (OpenSearch)
- **Variable**: ~$2/1K messages

## Troubleshooting

### 403 Error from OpenSearch
- Check IAM permissions in Lambda execution role
- Verify OpenSearch domain access policy
- Ensure AwsSigv4Signer is configured correctly

### Documents Not Processing
- Check S3 trigger is enabled
- Verify Lambda has permissions to read from S3
- Check CloudWatch logs for errors

### Chat Not Returning Context
- Verify OpenSearch index exists: `GET /chatbot-{id}`
- Check vectors were stored: `GET /chatbot-{id}/_search`
- Verify embedding dimensions match (1536)

### Widget Not Loading
- Check CORS settings on API Gateway
- Verify chatbot status is "active"
- Check browser console for errors

## Next Steps

1. **Add More Document Types**
   - DOCX, TXT, CSV support
   - URL scraping for web content

2. **Improve RAG Quality**
   - Experiment with chunk sizes
   - Add metadata filtering
   - Implement re-ranking

3. **Add Analytics**
   - Track message volume
   - Monitor response quality
   - User satisfaction ratings

4. **Optimize Costs**
   - Cache common queries
   - Use smaller embeddings model
   - Implement rate limiting

5. **Widget Enhancements**
   - Custom branding per chatbot
   - File upload in widget
   - Voice input support

## Dependencies Added

```json
{
  "openai": "^4.x",
  "langchain": "^0.x",
  "@langchain/openai": "^0.x",
  "@langchain/community": "^0.x"
}
```

## Environment Variables

Set via SST secrets:
```bash
npx sst secret set OPENAI_API_KEY sk-...
```

Auto-injected by SST:
- `OPENSEARCH_ENDPOINT`
- `APP_DATA_TABLE`
- `DOCUMENTS_BUCKET`
- `AWS_REGION`

## Success Criteria

✅ Upload PDF → Text extracted → Embeddings created → Stored in OpenSearch
✅ Ask question → Query embedded → Relevant chunks retrieved → Context added to prompt
✅ OpenAI generates response using retrieved context
✅ Widget displays response with proper formatting
✅ No authentication required for public chat endpoint
✅ All operations logged for debugging

---

**Status**: Ready for testing once OpenSearch deployment completes!
