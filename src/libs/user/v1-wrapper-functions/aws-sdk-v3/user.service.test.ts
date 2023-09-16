import { randomUUID } from 'crypto';

import type { PutCommandOutput } from '@aws-sdk/lib-dynamodb';

import { config } from 'src/config';

import { putDynamoDb, queryDynamoDb } from '../../../aws-sdk-v3/dynamodb';
import type {
  CreateUserInput,
  GetUsersByRoleOutput,
  Role,
  User,
} from '../../user.type';

import { createUser, getUsersByRole } from './user.service';

jest.mock('crypto');
jest.mock('../../../aws-sdk-v3/dynamodb');

describe('User service no layers aws sdk v3', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createUser', () => {
    it('should create user with readonly properties and put in dynamodb', async () => {
      jest.mocked(putDynamoDb).mockResolvedValueOnce({} as PutCommandOutput);

      const mockTime = '2023-01-01T00:00:00.000Z';
      jest.setSystemTime(new Date(mockTime));

      const mockUserId = '9aebce78-f438-46bb-917d-f0361015a8e9';
      jest.mocked(randomUUID).mockReturnValue(mockUserId);

      const mockUserInput: CreateUserInput = {
        email: 'TestUserEmail',
        role: 'ADMIN',
      };

      const createdUser = await createUser(mockUserInput);

      expect(createdUser).toEqual<User>({
        id: mockUserId,
        email: mockUserInput.email,
        role: mockUserInput.role,
        createdAt: mockTime,
        updatedAt: mockTime,
      });

      expect(putDynamoDb).toHaveBeenCalledWith<Parameters<typeof putDynamoDb>>({
        TableName: config.userTableName,
        Item: createdUser,
      });
    });
  });

  describe('getUsersByRole', () => {
    it('should query user by role from dynamodb', async () => {
      const role: Role = 'READER';

      const mockReaderUser: User = {
        id: 'TestUserId',
        email: 'test@email.com',
        role,
        createdAt: '2023-09-10T05:58:16.945Z',
        updatedAt: '2023-09-10T05:58:16.945Z',
      };

      jest.mocked(queryDynamoDb).mockResolvedValueOnce({
        $metadata: {},
        Items: [mockReaderUser],
      });

      await expect(getUsersByRole(role)).resolves.toEqual<GetUsersByRoleOutput>(
        [mockReaderUser],
      );

      expect(queryDynamoDb).toHaveBeenCalledWith({
        TableName: config.userTableName,
        IndexName: config.userTableRoleIndexName,
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': role },
        KeyConditionExpression: '#role = :role',
      });
    });
  });
});
