import { randomUUID } from 'crypto';

import { config } from 'src/config';
import { dynamoDbDocumentClient } from 'src/libs/aws-sdk-v2/dynamodb';

import {
  type CreateUserInput,
  type GetUsersByRoleOutput,
  type Role,
  type User,
  userSchema,
} from '../../user.type';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const createdAt = new Date().toISOString();

  const userToCreate = {
    id: randomUUID(),
    email: input.email,
    role: input.role,
    createdAt,
    updatedAt: createdAt,
  };

  await dynamoDbDocumentClient
    .put({
      TableName: config.userTableName,
      Item: userToCreate,
    })
    .promise();

  return userToCreate;
};

export const getUsersByRole = async (
  role: Role,
): Promise<GetUsersByRoleOutput> => {
  const { Items: maybeUsers } = await dynamoDbDocumentClient
    .query({
      TableName: config.userTableName,
      IndexName: config.userTableRoleIndexName,
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': role },
      KeyConditionExpression: '#role = :role',
    })
    .promise();

  if (!maybeUsers) {
    return [];
  }

  return maybeUsers.map((maybeUser) => userSchema.parse(maybeUser));
};
