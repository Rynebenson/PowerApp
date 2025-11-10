import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { putOrganization } from "@/lib/dynamo/orgs";
import { putUserOrganization } from "@/lib/dynamo/user-orgs";
import { putUser, getUser } from "@/lib/dynamo/users";
import { Organization, UserOrganization } from "@/lib/entities/org";

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub as string;
    console.log('Creating org for user:', userId);
    
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" })
      };
    }

    const { name, email, phone } = JSON.parse(event.body);
    console.log('Org data:', { name, email, phone });

    if (!name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Organization name is required" })
      };
    }

    const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const organization: Organization = {
      pk: `ORG#${orgId}`,
      sk: "PROFILE",
      entity_type: "ORGANIZATION",
      org_id: orgId,
      name,
      email,
      phone,
      created_at: now,
      updated_at: now
    };

    const userOrg: UserOrganization = {
      pk: `USER#${userId}`,
      sk: `ORG#${orgId}`,
      entity_type: "USER_ORGANIZATION",
      user_id: userId,
      org_id: orgId,
      role: "owner",
      created_at: now
    };

    console.log('Saving organization...');
    await putOrganization(organization);
    console.log('Saving user-org relationship...');
    await putUserOrganization(userOrg);

    console.log('Updating user active_org_id...');
    let user = await getUser(userId);
    if (!user) {
      console.log('User not found, creating...');
      user = {
        pk: `USER#${userId}`,
        sk: "PROFILE",
        entity_type: "USER",
        user_id: userId,
        email: event.requestContext.authorizer.jwt.claims.email as string || '',
        name: event.requestContext.authorizer.jwt.claims.name as string,
        picture: event.requestContext.authorizer.jwt.claims.picture as string,
        created_at: now,
        updated_at: now
      };
    }
    user.active_org_id = orgId;
    user.updated_at = now;
    await putUser(user);
    console.log('User updated with active_org_id:', orgId);

    return {
      statusCode: 201,
      body: JSON.stringify({ organization, role: "owner", orgId })
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) })
    };
  }
};
