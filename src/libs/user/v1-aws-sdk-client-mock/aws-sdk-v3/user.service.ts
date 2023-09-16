import { randomUUID } from 'crypto';

import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { config } from 'src/config';
import { dynamoDbDocumentClient } from 'src/libs/aws-sdk-v3/dynamodb';

import {
  type CreateUserInput,
  type GetUsersByRoleOutput,
  type Role,
  type User,
  userSchema,
} from '../../user.type';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const createdAt = new Date().toISOString();

  const userToCreate: User = {
    id: randomUUID(),
    email: input.email,
    role: input.role,
    createdAt,
    updatedAt: createdAt,
  };

  await dynamoDbDocumentClient.send(
    new PutCommand({
      TableName: config.userTableName,
      Item: userToCreate,
    }),
  );

  return userToCreate;
};

export const getUsersByRole = async (
  role: Role,
): Promise<GetUsersByRoleOutput> => {
  const { Items: maybeUsers } = await dynamoDbDocumentClient.send(
    new QueryCommand({
      TableName: config.userTableName,
      IndexName: config.userTableRoleIndexName,
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': role },
      KeyConditionExpression: '#role = :role',
    }),
  );

  if (!maybeUsers) {
    return [];
  }

  return maybeUsers.map((maybeUser) => userSchema.parse(maybeUser));
};
