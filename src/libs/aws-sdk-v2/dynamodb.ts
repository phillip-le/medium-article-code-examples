import { DynamoDB } from 'aws-sdk';

import { config } from 'src/config';

export const dynamoDbDocumentClient = new DynamoDB.DocumentClient(
  config.dynamoDbOptions,
);

export const queryDynamoDb = async (
  params: DynamoDB.DocumentClient.QueryInput,
): Promise<DynamoDB.DocumentClient.QueryOutput> =>
  await dynamoDbDocumentClient.query(params).promise();
