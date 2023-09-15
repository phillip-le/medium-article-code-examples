import type { PutCommandInput } from '@aws-sdk/lib-dynamodb';

import { config } from 'src/config';
import { putDynamoDb, queryDynamoDb } from 'src/libs/aws-sdk-v3/dynamodb';

import { createUserRepository } from './repository/user.repository.private';

export const userRepository = createUserRepository({
  putDynamoDb: async (input: PutCommandInput) => {
    await putDynamoDb(input);
  },
  queryDynamoDb,
  userTableName: config.userTableName,
  userTableRoleIndexName: config.userTableRoleIndexName,
});
