import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { HelpContext } from "../entities";

export async function putHelpContext(context: HelpContext): Promise<HelpContext> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: context,
    })
  );

  return context;
}

export async function listHelpContextByChatbot(chatbotId: string): Promise<HelpContext[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `CHATBOT#${chatbotId}`,
        ":sk": "CONTEXT#",
      },
    })
  );

  return (result.Items || []) as HelpContext[];
}

export async function deleteHelpContext(chatbotId: string, contextId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CHATBOT#${chatbotId}`,
        sk: `CONTEXT#${contextId}`,
      },
    })
  );
}
