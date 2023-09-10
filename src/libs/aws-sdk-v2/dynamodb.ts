import { DynamoDB } from 'aws-sdk';

import { config } from 'src/config';

export const dynamoDbDocumentClient = new DynamoDB.DocumentClient(
  config.dynamoDbOptions,
);
