import { DynamoDB } from 'aws-sdk';

import { config } from 'src/config';

export const dynamoDbDocumentClient = new DynamoDB.DocumentClient(
  config.dynamoDbOptions,
);

export const putDynamoDb = async (
  input: DynamoDB.DocumentClient.PutItemInput,
): Promise<DynamoDB.DocumentClient.PutItemOutput> =>
  await dynamoDbDocumentClient.put(input).promise();

export const queryDynamoDb = async (
  params: DynamoDB.DocumentClient.QueryInput,
): Promise<DynamoDB.DocumentClient.QueryOutput> =>
  await dynamoDbDocumentClient.query(params).promise();
