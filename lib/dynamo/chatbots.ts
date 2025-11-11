import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { Chatbot } from "../entities";

export async function putChatbot(chatbot: Chatbot): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `ORG#${chatbot.orgId}`,
        sk: `CHATBOT#${chatbot.id}`,
        gsi1pk: `CHATBOT#${chatbot.id}`,
        gsi1sk: "METADATA",
        entityType: "chatbot",
        ...chatbot,
      },
    })
  );
}

export async function getChatbot(chatbotId: string): Promise<Chatbot | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :gsi1pk AND gsi1sk = :gsi1sk",
      ExpressionAttributeValues: {
        ":gsi1pk": `CHATBOT#${chatbotId}`,
        ":gsi1sk": "METADATA",
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return result.Items[0] as Chatbot;
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
