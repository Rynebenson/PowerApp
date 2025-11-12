import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { getChatbot } from "../../../lib/dynamo";

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

const opensearchClient = new Client({
  ...AwsSigv4Signer({
    region: process.env.AWS_REGION!,
    service: "es",
  }),
  node: process.env.OPENSEARCH_ENDPOINT!,
});

const BEDROCK_MODELS: Record<string, { id: string; maxTokens: number }> = {
  "llama-3-8b": { id: "meta.llama3-8b-instruct-v1:0", maxTokens: 2048 },
  "claude-3-5-haiku": { id: "us.anthropic.claude-3-5-haiku-20241022-v1:0", maxTokens: 8000 },
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const chatbotId = event.pathParameters?.chatbotId;

  if (!chatbotId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "chatbotId is required" }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const { message } = body;

  if (!message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "message is required" }),
    };
  }

  try {
    const chatbot = await getChatbot(chatbotId);

    if (!chatbot || chatbot.status !== "active") {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Chatbot not found or inactive" }),
      };
    }

    // 1. Generate embedding for user query
    const queryEmbedding = await generateEmbedding(message);

    // 2. Search OpenSearch for relevant chunks
    const indexName = `chatbot-${chatbotId}`;
    let contextText = "";
    
    try {
      const searchResults = await opensearchClient.search({
        index: indexName,
        body: {
          size: 5,
          query: {
            knn: {
              vector: {
                vector: queryEmbedding,
                k: 5,
              },
            },
          },
        },
      });
      
      // 3. Extract context from search results
      const contexts = searchResults.body.hits.hits
        .filter((hit) => hit._source?.chunkText)
        .map((hit) => hit?._source?.chunkText as string);
      contextText = contexts.join("\n\n");
    } catch (error) {
      // Index doesn't exist yet or no documents - continue without context
      console.log("No context available:", error instanceof Error ? error.message : String(error));
    }

    // 4. Build prompt with context
    const prompt = buildPrompt(chatbot.systemPrompt, contextText, message);

    // 5. Call Bedrock model
    const modelConfig = BEDROCK_MODELS[chatbot.model] || BEDROCK_MODELS["claude-3-5-haiku"];
    const response = await generateResponse(modelConfig.id, prompt, chatbot.temperature, chatbot.maxTokens);

    return {
      statusCode: 200,
      body: JSON.stringify({ response }),
    };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: "amazon.titan-embed-text-v2:0",
      body: JSON.stringify({ inputText: text }),
    })
  );

  const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as { embedding: number[] };
  return responseBody.embedding;
}

function buildPrompt(systemPrompt: string, context: string, userMessage: string): string {
  if (context) {
    return `${systemPrompt}

Context from knowledge base:
${context}

User: ${userMessage}

Assistant:`;
  }
  return `${systemPrompt}

User: ${userMessage}

Assistant:`;
}

async function generateResponse(modelId: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
  if (modelId.startsWith("anthropic")) {
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: "user", content: prompt }],
        }),
      })
    );
    const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as { content: Array<{ text: string }> };
    return responseBody.content[0].text;
  } else {
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId,
        body: JSON.stringify({
          prompt,
          max_gen_len: maxTokens,
          temperature,
        }),
      })
    );
    const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as { generation: string };
    return responseBody.generation;
  }
}
