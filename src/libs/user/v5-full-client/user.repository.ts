import { randomUUID } from 'crypto';

import { config } from 'src/config';

import {
  type CreateUserInput,
  type GetUsersByRoleOutput,
  type Role,
  type User,
  userSchema,
} from '../user.type';

import { documentClient } from './documentClient';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const createdAt = new Date().toISOString();

  const userToCreate: User = {
    id: randomUUID(),
    email: input.email,
    role: input.role,
    createdAt,
    updatedAt: createdAt,
  };

  await documentClient.put({
    TableName: config.userTableName,
    Item: userToCreate,
  });

  return userToCreate;
};

export const getUsersByRole = async (
  role: Role,
): Promise<GetUsersByRoleOutput> => {
  const { Items: maybeUsers } = await documentClient.query({
    TableName: config.userTableName,
    IndexName: config.userTableRoleIndexName,
    ExpressionAttributeNames: { '#role': 'role' },
    ExpressionAttributeValues: { ':role': role },
    KeyConditionExpression: '#role = :role',
  });

  if (!maybeUsers) {
    return [];
  }

  return maybeUsers.map((maybeUser) => userSchema.parse(maybeUser));
};
