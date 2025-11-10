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
          body: JSON.stringify(user || {})
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error })
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
