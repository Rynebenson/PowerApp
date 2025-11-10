import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { getUser } from "@/lib/dynamo";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const userId = event.requestContext.authorizer?.jwt.claims.sub as string;
  const method = event.requestContext.http.method;
  
  switch (method) {
    case "GET":
      try {
        const user = await getUser(userId);

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user || { active_org_id: null })
        };
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active_org_id: null })
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
