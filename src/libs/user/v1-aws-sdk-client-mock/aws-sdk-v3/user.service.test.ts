import { randomUUID } from 'crypto';

import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';

import { config } from 'src/config';
import { dynamoDbDocumentClient } from 'src/libs/aws-sdk-v3/dynamodb';

import type {
  CreateUserInput,
  GetUsersByRoleOutput,
  Role,
  User,
} from '../../user.type';

import { createUser, getUsersByRole } from './user.service';

jest.mock('crypto');

describe('User service no layers aws sdk v3', () => {
  const mockDynamoDbDocumentClient = mockClient(dynamoDbDocumentClient);

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockDynamoDbDocumentClient.reset();
  });

  describe('createUser', () => {
    it('should create user with readonly properties and put in dynamodb', async () => {
      mockDynamoDbDocumentClient.on(PutCommand).resolves({});

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

      expect(mockDynamoDbDocumentClient).toHaveReceivedCommandWith(PutCommand, {
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

      mockDynamoDbDocumentClient.on(QueryCommand).resolves({
        Items: [mockReaderUser],
      });

      await expect(getUsersByRole(role)).resolves.toEqual<GetUsersByRoleOutput>(
        [mockReaderUser],
      );

      expect(mockDynamoDbDocumentClient).toHaveReceivedCommandWith(
        QueryCommand,
        {
          TableName: config.userTableName,
          IndexName: config.userTableRoleIndexName,
          ExpressionAttributeNames: { '#role': 'role' },
          ExpressionAttributeValues: { ':role': role },
          KeyConditionExpression: '#role = :role',
        },
      );
    });
  });
});
