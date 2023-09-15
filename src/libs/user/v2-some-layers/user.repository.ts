import { config } from 'src/config';
import { putDynamoDb, queryDynamoDb } from 'src/libs/aws-sdk-v3/dynamodb';

import {
  type GetUsersByRoleOutput,
  type Role,
  type User,
  userSchema,
} from '../user.type';

export const createUserDynamoDb = async (user: User): Promise<void> => {
  await putDynamoDb({
    TableName: config.userTableName,
    Item: user,
  });
};

export const getUsersByRoleDynamoDb = async (
  role: Role,
): Promise<GetUsersByRoleOutput> => {
  const { Items: maybeUsers } = await queryDynamoDb({
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
