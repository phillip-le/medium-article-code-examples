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

const dynamoDbClient = new DynamoDBClient(config.awsSdkV3Config.dynamoDb);

const dynamoDbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const putDynamoDb = async (
  params: PutCommandInput,
): Promise<PutCommandOutput> =>
  await dynamoDbDocumentClient.send(new PutCommand(params));

export const queryDynamoDb = async (
  params: QueryCommandInput,
): Promise<QueryCommandOutput> =>
  await dynamoDbDocumentClient.send(new QueryCommand(params));
