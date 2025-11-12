import { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";

const s3Client = new S3Client({});
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

const opensearchClient = new Client({
  ...AwsSigv4Signer({
    region: process.env.AWS_REGION!,
    service: "es",
  }),
  node: process.env.OPENSEARCH_ENDPOINT!,
});

async function ensureIndex(indexName: string) {
  try {
    const exists = await opensearchClient.indices.exists({ index: indexName });
    if (!exists.body) {
      console.log(`Creating index: ${indexName}`);
      const result = await opensearchClient.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              vector: {
                type: "knn_vector",
                dimension: 1024,
              },
              chatbotId: { type: "keyword" },
              contextId: { type: "keyword" },
              chunkText: { type: "text" },
              chunkIndex: { type: "integer" },
              s3Key: { type: "keyword" },
              timestamp: { type: "date" },
            },
          },
          settings: {
            "index.knn": true,
          },
        },
      });
      console.log(`Index created:`, result);
    }
  } catch (error) {
    console.error(`Error ensuring index ${indexName}:`, JSON.stringify(error, null, 2));
    throw error;
  }
}

export const handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    // Extract chatbotId and contextId from S3 key: chatbots/{chatbotId}/{contextId}/{filename}
    const parts = key.split("/");
    if (parts[0] !== "chatbots" || parts.length < 4) {
      console.log("Skipping non-chatbot file:", key);
      continue;
    }

    const chatbotId = parts[1];
    const contextId = parts[2];

    try {
      // 1. Download file from S3 (with retry for eventual consistency)
      let fileBuffer: Buffer | undefined;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const getObjectResponse = await s3Client.send(
            new GetObjectCommand({ Bucket: bucket, Key: key })
          );
          if (!getObjectResponse.Body) {
            throw new Error("No body in S3 response");
          }
          fileBuffer = await streamToBuffer(getObjectResponse.Body);
          break;
        } catch (error) {
          attempts++;
          const errorName = error instanceof Error && 'name' in error ? (error as { name: string }).name : '';
          if (errorName === "NoSuchKey" && attempts < maxAttempts) {
            console.log(`File not ready, waiting... (attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw error;
          }
        }
      }
      
      if (!fileBuffer) {
        throw new Error("Failed to download file from S3");
      }

      // 2. Extract text
      let text: string;
      if (key.endsWith(".pdf")) {
        text = await extractPdfText(fileBuffer);
      } else {
        text = fileBuffer.toString("utf-8");
      }

      // 3. Chunk text
      const chunks = chunkText(text, 500);
      console.log(`Processing ${chunks.length} chunks for ${key}`);

      // 4. Ensure index exists
      const indexName = `chatbot-${chatbotId}`;
      await ensureIndex(indexName);

      // 5. Generate embeddings and store in OpenSearch
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding using Bedrock Titan
        const embedding = await generateEmbedding(chunk);

        // Store in OpenSearch
        try {
          await opensearchClient.index({
            index: indexName,
            body: {
              chatbotId,
              contextId,
              chunkText: chunk,
              chunkIndex: i,
              vector: embedding,
              s3Key: key,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (indexError) {
          const message = indexError instanceof Error ? indexError.message : String(indexError);
          console.error(`Error indexing chunk ${i}:`, message);
          throw indexError;
        }
      }

      console.log(`Successfully processed ${key}`);
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      throw error;
    }
  }
};

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: "amazon.titan-embed-text-v2:0",
      body: JSON.stringify({ inputText: text }),
    })
  );

  const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as { embedding: number[] };
  return responseBody.embedding;
}

function chunkText(text: string, maxTokens: number): string[] {
  // Simple chunking by characters (rough approximation: 1 token ≈ 4 chars)
  const maxChars = maxTokens * 4;
  const chunks: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      
      // If single paragraph is too long, split by sentences
      if (paragraph.length > maxChars) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxChars) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks.filter(c => c.length > 0);
}

async function streamToBuffer(stream: ReadableStream | Blob | AsyncIterable<Uint8Array>): Promise<Buffer> {
  if (stream instanceof Blob) {
    const arrayBuffer = await stream.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
