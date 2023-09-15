import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  type PutCommandInput,
  type PutCommandOutput,
  type QueryCommandInput,
  type QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';

import { config } from 'src/config';

const dynamoDbClient = new DynamoDBClient(config.dynamoDbOptions);

export const dynamoDbDocumentClient =
  DynamoDBDocumentClient.from(dynamoDbClient);

export const putDynamoDb = async (
  params: PutCommandInput,
): Promise<PutCommandOutput> =>
  await dynamoDbDocumentClient.send(new PutCommand(params));

export const queryDynamoDb = async (
  params: QueryCommandInput,
): Promise<QueryCommandOutput> =>
  await dynamoDbDocumentClient.send(new QueryCommand(params));

export const putDynamoDbWithoutClient =
  (client: DynamoDBDocumentClient) => async (input: PutCommandInput) =>
    await client.send(new PutCommand(input));

export const queryDynamoDbWithoutClient =
  (client: DynamoDBDocumentClient) => async (input: QueryCommandInput) =>
    await client.send(new QueryCommand(input));
