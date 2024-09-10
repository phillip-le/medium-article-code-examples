import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamoDbClient = new DynamoDBClient();

export const documentClient = DynamoDBDocument.from(dynamoDbClient);
