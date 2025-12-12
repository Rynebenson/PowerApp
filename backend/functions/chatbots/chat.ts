import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Client } from "@opensearch-project/opensearch";
import { OpenAI } from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Resource } from "sst";
import { getChatbot } from "../../../lib/dynamo/chatbots";

// const openSearchClient = new Client({
//   node: Resource.VectorSearch.url,
//   auth: {
//     username: Resource.VectorSearch.username,
//     password: Resource.VectorSearch.password,
//   },
// });

const openai = new OpenAI({
  apiKey: Resource.OPENAI_API_KEY.value,
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const chatbotId = event.pathParameters?.chatbotId;

  if (!chatbotId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing chatbotId" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { message, sessionId } = body;

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message" }),
      };
    }

    // Get chatbot config
    const chatbot = await getChatbot(chatbotId);
    if (!chatbot) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Chatbot not found" }),
      };
    }

    if (chatbot.status !== "active") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Chatbot is inactive" }),
      };
    }

    // Create embedding for the user's message
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: Resource.OPENAI_API_KEY.value,
    });

    const queryEmbedding = await embeddings.embedQuery(message);

    // Search for relevant context in OpenSearch
    const indexName = `chatbot-${chatbotId}`;
    const contextChunks: string[] = [];

    try {
      // const searchResponse = await openSearchClient.search({
      //   index: indexName,
      //   body: {
      //     size: 5,
      //     query: {
      //       knn: {
      //         embedding: {
      //           vector: queryEmbedding,
      //           k: 5,
      //         },
      //       },
      //     },
      //   },
      // });

      // contextChunks = searchResponse.body.hits.hits
      //   .filter((hit) => hit._source && typeof hit._source === 'object' && 'text' in hit._source)
      //   .map((hit) => (hit._source as { text: string }).text);
    } catch (error) {
      // Index might not exist yet if no documents uploaded
      const opensearchError = error as { meta?: { body?: { error?: { type?: string } } } };
      if (opensearchError.meta?.body?.error?.type !== "index_not_found_exception") {
        console.error("OpenSearch error:", error);
      }
    }

    // Build prompt with context
    const systemPrompt = chatbot.system_prompt || "You are a helpful assistant.";
    const contextPrompt = contextChunks.length > 0
      ? `\n\nRelevant context:\n${contextChunks.join("\n\n")}`
      : "";

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cheap
      messages: [
        { role: "system", content: systemPrompt + contextPrompt },
        { role: "user", content: message },
      ],
      temperature: chatbot.temperature || 0.7,
      max_tokens: chatbot.max_tokens || 500,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        response,
        sessionId: sessionId || `session-${Date.now()}`,
      }),
    };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process chat message" }),
    };
  }
};
