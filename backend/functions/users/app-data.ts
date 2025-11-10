import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { getUser } from "@/lib/dynamo/users";
import { getUserOrganizations } from "@/lib/dynamo/user-orgs";
import { getOrganization } from "@/lib/dynamo/orgs";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub as string;

    const [user, userOrgs] = await Promise.all([
      getUser(userId),
      getUserOrganizations(userId),
    ]);

    const organizations = await Promise.all(
      userOrgs.map(async (userOrg) => {
        const org = await getOrganization(userOrg.org_id);
        return {
          id: userOrg.org_id,
          name: org?.name || "Unknown",
          role: userOrg.role,
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        user: user || { active_org_id: null },
        organizations,
      }),
    };
  } catch (error) {
    console.error("Error fetching app data:", error);
    return {
      statusCode: 200,
      body: JSON.stringify({
        user: { active_org_id: null },
        organizations: [],
      }),
    };
  }
};
