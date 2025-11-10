import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { UserOrganization } from "../entities/org";

export async function getUserOrganizations(userId: string): Promise<UserOrganization[]> {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "ORG#"
    }
  }));

  return (result.Items || []) as UserOrganization[];
}

export async function putUserOrganization(userOrg: UserOrganization): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: userOrg
  }));
}
