import { APIGatewayProxyHandlerV2 } from "aws-lambda"

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    switch(event.requestContext.http.method) {
      case "GET":
        return {
          statusCode: 200,
          body: JSON.stringify({
            status: "Healthy",
            stage: process.env.STAGE,
            timestamp: new Date().toISOString()
          })
        }
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: "Method not allowed" })
        }
    }
  } catch(error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error }) 
    }
  }
}