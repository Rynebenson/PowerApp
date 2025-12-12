import { GetCommand, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./client";
import { Article } from "../entities";

export async function getArticle(articleId: string): Promise<Article | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :gsi1pk",
      ExpressionAttributeValues: {
        ":gsi1pk": `ARTICLE#${articleId}`,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return result.Items[0] as Article;
}

export async function putArticle(article: Article): Promise<Article> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...article,
        gsi1pk: `ARTICLE#${article.article_id}`,
        gsi1sk: article.chatbot_id,
      },
    })
  );

  return article;
}

export async function listArticlesByCollection(collectionId: string): Promise<Article[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `COLLECTION#${collectionId}`,
        ":sk": "ARTICLE#",
      },
    })
  );

  return (result.Items || []) as Article[];
}

export async function incrementArticleViewCount(collectionId: string, articleId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `COLLECTION#${collectionId}`,
        sk: `ARTICLE#${articleId}`,
      },
      UpdateExpression: "SET view_count = if_not_exists(view_count, :zero) + :inc",
      ExpressionAttributeValues: {
        ":zero": 0,
        ":inc": 1,
      },
    })
  );
}

export async function deleteArticle(collectionId: string, articleId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `COLLECTION#${collectionId}`,
        sk: `ARTICLE#${articleId}`,
      },
    })
  );
}
