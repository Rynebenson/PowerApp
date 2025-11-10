import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { getUser, putUser } from "@/lib/dynamo/users";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;
  
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing request body" })
    };
  }

  const { org_id } = JSON.parse(event.body);

  if (!org_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Organization ID is required" })
    };
  }

  const user = await getUser(userId);
  if (!user) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "User not found" })
    };
  }

  user.active_org_id = org_id;
  user.updated_at = new Date().toISOString();
  await putUser(user);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
