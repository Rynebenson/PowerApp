import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { Chatbot } from "../entities";

export async function getChatbot(chatbotId: string): Promise<Chatbot | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND sk = :sk",
      ExpressionAttributeValues: {
        ":pk": `CHATBOT#${chatbotId}`,
        ":sk": `CHATBOT#${chatbotId}`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return result.Items[0] as Chatbot;
}

export async function putChatbot(chatbot: Chatbot): Promise<Chatbot> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: chatbot,
    })
  );

  return chatbot;
}

export async function listChatbotsByOrg(orgId: string): Promise<Chatbot[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `ORG#${orgId}`,
        ":sk": "CHATBOT#",
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items as Chatbot[];
}
