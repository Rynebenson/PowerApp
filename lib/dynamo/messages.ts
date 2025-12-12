import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { Message } from "../entities";

export async function putMessage(message: Message): Promise<Message> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: message,
    })
  );

  return message;
}

export async function listMessagesByConversation(conversationId: string, limit = 50): Promise<Message[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `CONVERSATION#${conversationId}`,
        ":sk": "MESSAGE#",
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    })
  );

  return (result.Items || []) as Message[];
}
