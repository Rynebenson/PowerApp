import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { putChatbot, listChatbotsByOrg, getUser } from "../../../lib/dynamo";
import { Chatbot } from "../../../lib/entities";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  console.log('Chatbot manage handler called:', { 
    method: event.requestContext.http.method,
    path: event.requestContext.http.path 
  });
  
  const method = event.requestContext.http.method;
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;
  
  const user = await getUser(userId);
  
  if (!user?.active_org_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: "No active organization found. Please create or switch to an organization first." 
      }),
    };
  }
  
  const orgId = user.active_org_id;
  console.log('Using orgId:', orgId);

  try {
    switch (method) {
      case "GET": {
        const chatbots = await listChatbotsByOrg(orgId);
        return {
          statusCode: 200,
          body: JSON.stringify({ chatbots }),
        };
      }

      case "POST": {
        const body = JSON.parse(event.body || "{}");
        const { name, description, model, system_prompt, temperature, max_tokens } = body;

        if (!name || !model) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "name and model are required" }),
          };
        }

        const chatbotId = uuidv4();
        const embedCode = `<script>(function(){var s=document.createElement('script');s.src='https://powerapp.rynebenson.com/widget.js';s.setAttribute('data-chatbot-id','${chatbotId}');s.async=true;document.head.appendChild(s);})();</script>`;

        const chatbot: Chatbot = {
          pk: `ORG#${orgId}`,
          sk: `CHATBOT#${chatbotId}`,
          entity_type: 'chatbot',
          chatbot_id: chatbotId,
          org_id: orgId,
          name,
          description: description || "",
          system_prompt: system_prompt || "You are a helpful assistant.",
          model,
          temperature: temperature || 0.7,
          max_tokens: max_tokens || 2000,
          status: "active",
          embed_code: embedCode,
          theme: {
            primary_color: '#6366f1',
            gradient_enabled: false,
          },
          events: [{
            id: uuidv4(),
            description: "Chatbot created",
            timestamp: new Date().toISOString(),
            user_id: userId,
          }],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await putChatbot(chatbot);

        return {
          statusCode: 201,
          body: JSON.stringify({ chatbot }),
        };
      }

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: "Method not allowed" }),
        };
    }
  } catch (error) {
    console.error("Error in chatbot handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
    };
  }
};
