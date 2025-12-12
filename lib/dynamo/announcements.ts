import { GetCommand, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { Announcement } from "../entities";

export async function getAnnouncement(announcementId: string): Promise<Announcement | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :gsi1pk",
      ExpressionAttributeValues: {
        ":gsi1pk": `ANNOUNCEMENT#${announcementId}`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return result.Items[0] as Announcement;
}

export async function putAnnouncement(announcement: Announcement): Promise<Announcement> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...announcement,
        gsi1pk: `ANNOUNCEMENT#${announcement.announcement_id}`,
        gsi1sk: announcement.chatbot_id,
      },
    })
  );

  return announcement;
}

export async function listAnnouncementsByChatbot(chatbotId: string): Promise<Announcement[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `CHATBOT#${chatbotId}`,
        ":sk": "ANNOUNCEMENT#",
      },
    })
  );

  return (result.Items || []) as Announcement[];
}

export async function deleteAnnouncement(chatbotId: string, announcementId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `CHATBOT#${chatbotId}`,
        sk: `ANNOUNCEMENT#${announcementId}`,
      },
    })
  );
}
