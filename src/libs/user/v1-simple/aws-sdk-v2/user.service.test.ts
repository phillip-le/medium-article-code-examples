import { randomUUID } from 'crypto';

import type { DynamoDB } from 'aws-sdk';

import { config } from 'src/config';
import { dynamoDbDocumentClient } from 'src/libs/aws-sdk-v2/dynamodb';

import type { CreateUserInput, User } from '../../user.type';

import { createUser, getUsersByRole } from './user.service';

jest.mock('crypto');

describe('User service no layers aws sdk v2', () => {
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
      const mockPutDynamoDb = jest.fn().mockImplementation(() => ({
        promise: jest.fn(),
      }));
      jest
        .spyOn(dynamoDbDocumentClient, 'put')
        .mockImplementation(mockPutDynamoDb);

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

      expect(mockPutDynamoDb).toHaveBeenCalledWith<
        [DynamoDB.DocumentClient.PutItemInput]
      >({
        TableName: config.userTableName,
        Item: {
          id: mockUserId,
          email: mockUserInput.email,
          role: mockUserInput.role,
          createdAt: mockTime,
          updatedAt: mockTime,
        },
      });
    });
  });

  describe('getUsersByRole', () => {
    it('should query user by role from dynamodb', async () => {
      const mockReaderUser: User = {
        id: 'TestUserId',
        email: 'test@email.com',
        role: 'READER',
        createdAt: '2023-09-10T05:58:16.945Z',
        updatedAt: '2023-09-10T05:58:16.945Z',
      };

      const mockQueryDynamoDb = jest.fn().mockImplementation(() => ({
        promise: jest.fn().mockResolvedValue({ Items: [mockReaderUser] }),
      }));
      jest
        .spyOn(dynamoDbDocumentClient, 'query')
        .mockImplementation(mockQueryDynamoDb);

      await expect(getUsersByRole('READER')).resolves.toEqual([mockReaderUser]);

      expect(mockQueryDynamoDb).toHaveBeenCalledWith<
        [DynamoDB.DocumentClient.QueryInput]
      >({
        TableName: config.userTableName,
        IndexName: config.userTableRoleIndexName,
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': mockReaderUser.role },
        KeyConditionExpression: '#role = :role',
      });
    });
  });
});
