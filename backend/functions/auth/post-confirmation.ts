import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PostConfirmationTriggerEvent } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: PostConfirmationTriggerEvent) => {
  const { userAttributes } = event.request;
  const userName = event.userName;
  
  const userRecord = {
    pk: `USER#${userName}`,
    sk: `PROFILE`,
    entity_type: "USER",
    user_id: userName,
    email: userAttributes.email,
    phone: userAttributes.phone_number,
    name: userAttributes.name || `${userAttributes.given_name} ${userAttributes.family_name}`,
    given_name: userAttributes.given_name,
    family_name: userAttributes.family_name,
    profile_picture: userAttributes.picture || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({
    TableName: process.env.APP_DATA_TABLE!,
    Item: userRecord,
  }));

  return event;
};