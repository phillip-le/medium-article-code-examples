import { randomUUID } from 'crypto';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  type PutCommandInput,
} from '@aws-sdk/lib-dynamodb';

import {
  putDynamoDbWithoutClient,
  queryDynamoDbWithoutClient,
} from 'src/libs/aws-sdk-v3/dynamodb';

import type { EnvironmentConfig } from './config';
import * as EntityLogic from './entity/user.entity.private';
import { createUserRepository } from './repository/user.repository.private';
import * as UseCaseLogic from './use-case/user.use-case.private';
import type { UserPlatform } from './user.module.type';

export const createUserPlatform = (config: EnvironmentConfig): UserPlatform => {
  const dynamoDbClient = new DynamoDBClient(config.dynamoDbOptions);
  const dynamoDbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient);

  const userRepository = createUserRepository({
    userTableName: config.userTableName,
    userTableRoleIndexName: config.userTableRoleIndexName,
    putDynamoDb: async (input: PutCommandInput) => {
      await putDynamoDbWithoutClient(dynamoDbDocumentClient)(input);
    },
    queryDynamoDb: queryDynamoDbWithoutClient(dynamoDbDocumentClient),
  });

  const createUserEntity = EntityLogic.createUserEntity({
    getCreatedTime: () => new Date(),
    createUserId: randomUUID,
  });

  const createUserUseCase = UseCaseLogic.createUserUseCase({
    persistUser: userRepository.persistUser,
    createUserEntity,
  });

  const getUsersByRoleUseCase = UseCaseLogic.getUsersByRoleUseCase(
    userRepository.getUsersByRole,
  );

  return {
    createUserUseCase,
    getUsersByRoleUseCase,
  };
};
