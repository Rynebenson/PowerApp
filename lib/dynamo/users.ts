import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { User, UserPreferences } from "../entities";

export async function getUser(userId: string): Promise<User | null> {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      pk: `USER#${userId}`,
      sk: "PROFILE"
    }
  }));

  return result.Item as User | null;
}

export async function putUser(user: User): Promise<User> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: user
  }));

  return user;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      pk: `USER#${userId}`,
      sk: "PREFERENCES"
    }
  }));

  return result.Item as UserPreferences | null;
}

export async function putUserPreferences(preferences: UserPreferences): Promise<UserPreferences> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: preferences
  }));

  return preferences;
}
