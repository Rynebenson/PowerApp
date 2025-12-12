import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { Conversation, Message } from "../entities";

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :gsi1pk",
      ExpressionAttributeValues: {
        ":gsi1pk": `CONVERSATION#${conversationId}`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return result.Items[0] as Conversation;
}

export async function putConversation(conversation: Conversation): Promise<Conversation> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...conversation,
        gsi1pk: `CONVERSATION#${conversation.conversation_id}`,
        gsi1sk: conversation.chatbot_id,
      },
    })
  );

  return conversation;
}

export async function listConversationsByChatbot(chatbotId: string): Promise<Conversation[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `CHATBOT#${chatbotId}`,
        ":sk": "CONVERSATION#",
      },
    })
  );

  return (result.Items || []) as Conversation[];
}

export async function updateConversationStatus(
  chatbotId: string,
  conversationId: string,
  status: Conversation['status']
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CHATBOT#${chatbotId}`,
        sk: `CONVERSATION#${conversationId}`,
      },
      UpdateExpression: "SET #status = :status, updated_at = :updated_at",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":updated_at": new Date().toISOString(),
      },
    })
  );
}

export async function assignConversation(
  chatbotId: string,
  conversationId: string,
  assignedTo: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CHATBOT#${chatbotId}`,
        sk: `CONVERSATION#${conversationId}`,
      },
      UpdateExpression: "SET assigned_to = :assigned_to, #status = :status, updated_at = :updated_at",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":assigned_to": assignedTo,
        ":status": "assigned",
        ":updated_at": new Date().toISOString(),
      },
    })
  );
}
