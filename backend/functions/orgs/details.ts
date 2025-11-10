import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { getOrganization, getOrgMembers, getUser } from "@/lib/dynamo";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const userId = event.requestContext.authorizer?.jwt.claims.sub as string;
  const method = event.requestContext.http.method;
  
  switch (method) {
    case "GET":
      try {
        const user = await getUser(userId);
        
        if (!user) {
          return {
            statusCode: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "User not found" })
          };
        }

        // For now, we'll use a default org. In production, we'll get this from user data
        const orgId = "default";
        const [org, members] = await Promise.all([
          getOrganization(orgId),
          getOrgMembers(orgId)
        ]);

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organization: org, members })
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
