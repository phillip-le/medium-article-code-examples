import type {
  PutCommandInput,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';

import { userSchema } from '../../user.type';
import type { UserRepository } from '../user.module.type';

export const createUserRepository = ({
  putDynamoDb,
  queryDynamoDb,
  userTableName,
  userTableRoleIndexName,
}: {
  putDynamoDb: (input: PutCommandInput) => Promise<void>;
  queryDynamoDb: (input: QueryCommandInput) => Promise<QueryCommandOutput>;
  userTableName: string;
  userTableRoleIndexName: string;
}): UserRepository => ({
  persistUser: async (user) => {
    await putDynamoDb({
      TableName: userTableName,
      Item: user,
    });
  },
  getUsersByRole: async (role) => {
    const { Items: maybeUsers } = await queryDynamoDb({
      TableName: userTableName,
      IndexName: userTableRoleIndexName,
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': role },
      KeyConditionExpression: '#role = :role',
    });

    if (!maybeUsers) {
      return [];
    }

    return maybeUsers.map((maybeUser) => userSchema.parse(maybeUser));
  },
});
