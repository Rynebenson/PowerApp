import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { getChatbot, putChatbot, docClient, TABLE_NAME } from "../../../lib/dynamo";

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.DOCUMENTS_BUCKET!;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const method = event.requestContext.http.method;
  const chatbotId = event.pathParameters?.chatbotId;
  const contextId = event.pathParameters?.contextId;
  const userId = event.requestContext.authorizer.jwt.claims.sub as string;

  if (!chatbotId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "chatbotId is required" }),
    };
  }

  try {
    const chatbot = await getChatbot(chatbotId);

    if (!chatbot) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Chatbot not found" }),
      };
    }

    switch (method) {
      case "GET": {
        // List all context items for this chatbot
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

        return {
          statusCode: 200,
          body: JSON.stringify({ contexts: result.Items || [] }),
        };
      }

      case "POST": {
        const body = JSON.parse(event.body || "{}");
        const { fileName, fileType, type = "document" } = body;

        if (!fileName) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "fileName is required" }),
          };
        }

        const contextId = uuidv4();
        const s3Key = `chatbots/${chatbotId}/context/${contextId}/${fileName}`;

        // Generate presigned URL for upload
        const uploadUrl = await getSignedUrl(
          s3Client,
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: fileType,
          }),
          { expiresIn: 3600 }
        );

        // Save context metadata to DynamoDB
        const context = {
          pk: `CHATBOT#${chatbotId}`,
          sk: `CONTEXT#${contextId}`,
          entityType: "chatbot_context",
          id: contextId,
          chatbotId,
          type,
          s3Key,
          metadata: {
            filename: fileName,
          },
          createdAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: context,
          })
        );

        // Add event for file upload
        const events = [...(chatbot.events || [])];
        events.push({
          id: uuidv4(),
          description: `Uploaded ${fileName}`,
          timestamp: new Date().toISOString(),
          userId,
        });

        const updatedChatbot = {
          ...chatbot,
          events,
          updatedAt: new Date().toISOString(),
        };

        await putChatbot(updatedChatbot);

        return {
          statusCode: 200,
          body: JSON.stringify({ uploadUrl, contextId }),
        };
      }

      case "DELETE": {
        if (!contextId) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "contextId is required" }),
          };
        }

        // Get context to find S3 key
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk AND sk = :sk",
            ExpressionAttributeValues: {
              ":pk": `CHATBOT#${chatbotId}`,
              ":sk": `CONTEXT#${contextId}`,
            },
          })
        );

        if (!result.Items || result.Items.length === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: "Context not found" }),
          };
        }

        const context = result.Items[0];

        // Delete from S3
        if (context.s3Key) {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: context.s3Key,
            })
          );
        }

        // Delete from DynamoDB
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              pk: `CHATBOT#${chatbotId}`,
              sk: `CONTEXT#${contextId}`,
            },
          })
        );

        // Add event
        const events = [...(chatbot.events || [])];
        events.push({
          id: uuidv4(),
          description: `Deleted ${context.metadata?.filename || 'document'}`,
          timestamp: new Date().toISOString(),
          userId,
        });

        const updatedChatbot = {
          ...chatbot,
          events,
          updatedAt: new Date().toISOString(),
        };

        await putChatbot(updatedChatbot);

        return {
          statusCode: 200,
          body: JSON.stringify({ success: true }),
        };
      }

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: "Method not allowed" }),
        };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
