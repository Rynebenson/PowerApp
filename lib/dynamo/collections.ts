import { GetCommand, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { Collection } from "../entities";

export async function getCollection(collectionId: string): Promise<Collection | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :gsi1pk",
      ExpressionAttributeValues: {
        ":gsi1pk": `COLLECTION#${collectionId}`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return result.Items[0] as Collection;
}

export async function putCollection(collection: Collection): Promise<Collection> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...collection,
        gsi1pk: `COLLECTION#${collection.collection_id}`,
        gsi1sk: collection.chatbot_id,
      },
    })
  );

  return collection;
}

export async function listCollectionsByChatbot(chatbotId: string): Promise<Collection[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `CHATBOT#${chatbotId}`,
        ":sk": "COLLECTION#",
      },
    })
  );

  return (result.Items || []) as Collection[];
}

export async function deleteCollection(chatbotId: string, collectionId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CHATBOT#${chatbotId}`,
        sk: `COLLECTION#${collectionId}`,
      },
    })
  );
}
