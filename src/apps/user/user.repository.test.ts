import type {
  PutCommandInput,
  PutCommandOutput,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { config } from 'src/config';

import { putDynamoDb, queryDynamoDb } from '../../libs/aws-sdk-v3/dynamodb';
import type { GetUsersByRoleOutput, Role, User } from '../user.type';

import { createUserDynamoDb, getUsersByRoleDynamoDb } from './user.repository';

jest.mock('../../libs/aws-sdk-v3/dynamodb');

describe('UserRepository', () => {
  const mockUser: User = {
    id: 'TestUserId',
    email: 'test@email.com',
    role: 'ADMIN',
    createdAt: '2023-09-10T05:58:16.945Z',
    updatedAt: '2023-09-10T05:58:16.945Z',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createUserDynamoDb', () => {
    it('should put user into dynamodb', async () => {
      jest.mocked(putDynamoDb).mockResolvedValue({} as PutCommandOutput);

      await createUserDynamoDb(mockUser);

      expect(putDynamoDb).toHaveBeenCalledWith<[PutCommandInput]>({
        TableName: config.userTableName,
        Item: mockUser,
      });
    });
  });

  describe('getUsersByRoleDynamoDb', () => {
    it('should query user by role from dynamodb', async () => {
      const role: Role = 'READER';

      const mockReaderUser: User = {
        ...mockUser,
        role,
      };

      jest.mocked(queryDynamoDb).mockResolvedValue({
        $metadata: {},
        Items: [mockReaderUser],
      });

      await expect(
        getUsersByRoleDynamoDb(role),
      ).resolves.toEqual<GetUsersByRoleOutput>([mockReaderUser]);

      expect(queryDynamoDb).toHaveBeenCalledWith<[QueryCommandInput]>({
        TableName: config.userTableName,
        IndexName: config.userTableRoleIndexName,
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': role },
        KeyConditionExpression: '#role = :role',
      });
    });
  });
});
