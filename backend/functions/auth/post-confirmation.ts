import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PostConfirmationTriggerEvent } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: PostConfirmationTriggerEvent) => {
  try {
    const { userAttributes } = event.request;
    const userName = event.userName;
    
    console.log('Post-confirmation for user:', userName);
    
    const userRecord = {
      pk: `USER#${userName}`,
      sk: "PROFILE",
      entity_type: "USER",
      user_id: userName,
      email: userAttributes.email,
      name: userAttributes.name || `${userAttributes.given_name || ''} ${userAttributes.family_name || ''}`.trim(),
      picture: userAttributes.picture,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Creating user record:', userRecord);

    await docClient.send(new PutCommand({
      TableName: process.env.APP_DATA_TABLE!,
      Item: userRecord,
    }));

    console.log('User record created successfully');

    return event;
  } catch (error) {
    console.error('Error in post-confirmation:', error);
    return event;
  }
};