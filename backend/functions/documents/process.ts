import { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Client } from "@opensearch-project/opensearch";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Resource } from "sst";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../../lib/dynamo/client";
import pdfParse from "pdf-parse";

const s3Client = new S3Client({});

// const openSearchClient = new Client({
//   node: Resource.VectorSearch.url,
//   auth: {
//     username: Resource.VectorSearch.username,
//     password: Resource.VectorSearch.password,
//   },
// });

export const handler = async (event: S3Event) => {
  console.log("Processing document upload:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    // Extract chatbotId and contextId from S3 key: chatbots/{chatbotId}/context/{contextId}/{filename}
    const parts = key.split("/");
    if (parts.length < 4 || parts[0] !== "chatbots" || parts[2] !== "context") {
      console.log("Skipping non-context file:", key);
      continue;
    }

    const chatbotId = parts[1];
    const contextId = parts[3];

    try {
      // Download file from S3
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );

      const fileBuffer = await response.Body?.transformToByteArray();
      if (!fileBuffer) {
        throw new Error("Failed to read file from S3");
      }

      // Extract text from PDF
      const pdfData = await pdfParse(Buffer.from(fileBuffer));
      const text = pdfData.text;

      // Split text into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const chunks = await splitter.splitText(text);
      console.log(`Split into ${chunks.length} chunks`);

      // Create embeddings
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: Resource.OPENAI_API_KEY.value,
      });

      const indexName = `chatbot-${chatbotId}`;

      // Create index if it doesn't exist

      // const indexExists = await openSearchClient.indices.exists({ index: indexName });

      // if (!indexExists.body) {
      //   await openSearchClient.indices.create({
      //     index: indexName,
      //     body: {
      //       mappings: {
      //         properties: {
      //           text: { type: "text" },
      //           embedding: {
      //             type: "knn_vector",
      //             dimension: 1536, // OpenAI embedding dimension
      //           },
      //           contextId: { type: "keyword" },
      //           chatbotId: { type: "keyword" },
      //         },
      //       },
      //       settings: {
      //         "index.knn": true,
      //       },
      //     },
      //   });
      //   console.log(`Created index: ${indexName}`);
      //   // Wait longer for index to be ready
      //   await new Promise(resolve => setTimeout(resolve, 5000));
      // }

      // Generate embeddings and store in OpenSearch
      const vectorIds: string[] = [];
      console.log(`Generating embeddings for ${chunks.length} chunks...`);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        const embedding = await embeddings.embedQuery(chunk);

        const docId = `${contextId}-${i}`;
        let retries = 3;
        while (retries > 0) {
          try {
            // await openSearchClient.index({
            //   index: indexName,
            //   id: docId,
            //   body: {
            //     text: chunk,
            //     embedding,
            //     contextId,
            //     chatbotId,
            //   },
            // });
            // vectorIds.push(docId);
            break;
          } catch (err) {
            retries--;
            if (retries === 0) throw err;
            console.log(`Retry indexing chunk ${i}, ${retries} retries left`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      console.log(`Stored ${vectorIds.length} vectors in OpenSearch`);

      // Update context metadata in DynamoDB with vectorIds
      await docClient.send(
        new PutCommand({
          TableName: Resource.AppDataTable.name,
          Item: {
            pk: `CHATBOT#${chatbotId}`,
            sk: `CONTEXT#${contextId}`,
            entityType: "chatbot-context",
            id: contextId,
            chatbotId,
            type: "document",
            content: key,
            metadata: {
              filename: parts[parts.length - 1],
              vectorIds,
            },
            createdAt: new Date().toISOString(),
          },
        })
      );

      console.log(`Updated context metadata for ${contextId}`);
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      if (error && typeof error === 'object' && 'meta' in error) {
        const opensearchError = error as { meta?: { body?: unknown } };
        console.error('OpenSearch error details:', JSON.stringify(opensearchError.meta?.body, null, 2));
      }
      throw error;
    }
  }
};
