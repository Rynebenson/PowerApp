import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { getChatbot, putChatbot, getUser } from "../../../lib/dynamo";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const method = event.requestContext.http.method;
  const chatbotId = event.pathParameters?.chatbotId;

  if (!chatbotId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "chatbotId is required" }),
    };
  }

  try {
    switch (method) {
      case "GET": {
        const chatbot = await getChatbot(chatbotId);

        if (!chatbot) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: "Chatbot not found" }),
          };
        }

        // Fetch user details for events
        const userIds = [...new Set(chatbot.events?.map(e => e.userId).filter(Boolean) || [])];
        const users = await Promise.all(
          userIds.map(async (userId) => {
            const user = await getUser(userId!);
            return user ? { userId, name: user.name || user.email } : null;
          })
        );
        const userMap = Object.fromEntries(
          users.filter(Boolean).map(u => [u!.userId, u])
        );

        return {
          statusCode: 200,
          body: JSON.stringify({ chatbot, users: userMap }),
        };
      }

      case "PUT": {
        const chatbot = await getChatbot(chatbotId);

        if (!chatbot) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: "Chatbot not found" }),
          };
        }

        const body = JSON.parse(event.body || "{}");
        const userId = event.requestContext.authorizer.jwt.claims.sub as string;
        const events = [...(chatbot.events || [])];
        
        // Track model changes
        if (body.model && body.model !== chatbot.model) {
          events.push({
            id: uuidv4(),
            description: `Chatbot model updated to ${body.model}`,
            timestamp: new Date().toISOString(),
            userId,
          });
        }
        
        // Track status changes
        if (body.status && body.status !== chatbot.status) {
          events.push({
            id: uuidv4(),
            description: `Chatbot status changed to ${body.status}`,
            timestamp: new Date().toISOString(),
            userId,
          });
        }
        
        // Track system prompt changes
        if (body.systemPrompt !== undefined && body.systemPrompt !== chatbot.systemPrompt) {
          events.push({
            id: uuidv4(),
            description: "System prompt updated",
            timestamp: new Date().toISOString(),
            userId,
          });
        }
        
        // Track temperature changes
        if (body.temperature !== undefined && body.temperature !== chatbot.temperature) {
          events.push({
            id: uuidv4(),
            description: `Temperature updated to ${body.temperature}`,
            timestamp: new Date().toISOString(),
            userId,
          });
        }
        
        // Track maxTokens changes
        if (body.maxTokens !== undefined && body.maxTokens !== chatbot.maxTokens) {
          events.push({
            id: uuidv4(),
            description: `Max tokens updated to ${body.maxTokens}`,
            timestamp: new Date().toISOString(),
            userId,
          });
        }

        const updatedChatbot = {
          ...chatbot,
          ...body,
          id: chatbot.id,
          orgId: chatbot.orgId,
          embedCode: chatbot.embedCode,
          events,
          createdAt: chatbot.createdAt,
          updatedAt: new Date().toISOString(),
        };

        await putChatbot(updatedChatbot);

        return {
          statusCode: 200,
          body: JSON.stringify({ chatbot: updatedChatbot }),
        };
      }

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: "Method not allowed" }),
        };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
