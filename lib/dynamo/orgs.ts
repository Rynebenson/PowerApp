import { GetCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { Organization } from "../entities";

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      pk: `ORG#${orgId}`,
      sk: "PROFILE"
    }
  }));

  return result.Item as Organization | null;
}

export async function getOrgMembers(orgId: string) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
    ExpressionAttributeValues: {
      ":pk": `ORG#${orgId}`,
      ":sk": "MEMBER#"
    }
  }));

  return result.Items || [];
}

export async function putOrganization(org: Organization): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: org
  }));
}
