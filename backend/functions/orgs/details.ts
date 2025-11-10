import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { getOrganization, getOrgMembers, getUser } from "@/lib/dynamo";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const userId = event.requestContext.authorizer?.jwt.claims.sub as string;
  const method = event.requestContext.http.method;
  
  switch (method) {
    case "GET":
      try {
        const user = await getUser(userId);
        
        if (!user || !user.active_org_id) {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organization: null, members: [] })
          };
        }

        const [org, members] = await Promise.all([
          getOrganization(user.active_org_id),
          getOrgMembers(user.active_org_id)
        ]);

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organization: org, members })
        };
      } catch (error) {
        console.error('Error in orgs/details:', error);
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: String(error) })
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
