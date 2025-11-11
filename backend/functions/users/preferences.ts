import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { getUserPreferences, putUserPreferences } from "@/lib/dynamo";
import { UserPreferences } from "@/lib/entities";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const userId = event.requestContext.authorizer?.jwt.claims.sub as string;
  const method = event.requestContext.http.method;
  
  switch (method) {
    case "GET":
      try {
        const preferences = await getUserPreferences(userId);

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences || {})
        };
      } catch (error) {
        console.error("Error fetching preferences:", error);
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Failed to fetch preferences" })
        };
      }

    case "PUT":
      try {
        const body = JSON.parse(event.body || "{}");
        
        const preferences: UserPreferences = {
          pk: `USER#${userId}`,
          sk: "PREFERENCES",
          entity_type: "USER_PREFERENCES",
          user_id: userId,
          ...body,
          updated_at: new Date().toISOString()
        };

        const result = await putUserPreferences(preferences);

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result)
        };
      } catch (error) {
        console.error("Error updating preferences:", error);
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Failed to update preferences" })
        };
      }

    default:
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" })
      };
  }
};