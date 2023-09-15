import type {
  PutCommandInput,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';

import type { GetUsersByRoleOutput, Role, User } from '../../user.type';

import { createUserRepository } from './user.repository.private';

describe('UserRepository', () => {
  const mockUser: User = {
    id: 'TestUserId',
    email: 'test@email.com',
    role: 'ADMIN',
    createdAt: '2023-09-10T05:58:16.945Z',
    updatedAt: '2023-09-10T05:58:16.945Z',
  };

  const mockUserTableName = 'TestUserTableName';
  const mockUserTableRoleIndexName = 'TestUserTableRoleIndexName';

  const mockPutDynamoDb = jest.fn() as (
    input: PutCommandInput,
  ) => Promise<void>;
  const mockQueryDynamoDb = jest.fn() as (
    input: QueryCommandInput,
  ) => Promise<QueryCommandOutput>;

  const userRepository = createUserRepository({
    putDynamoDb: mockPutDynamoDb,
    queryDynamoDb: mockQueryDynamoDb,
    userTableName: mockUserTableName,
    userTableRoleIndexName: mockUserTableRoleIndexName,
  });

  describe('createUserDynamoDb', () => {
    it('should put user into dynamodb', async () => {
      jest.mocked(mockPutDynamoDb).mockResolvedValue();

      await userRepository.persistUser(mockUser);

      expect(mockPutDynamoDb).toHaveBeenCalledWith<[PutCommandInput]>({
        TableName: mockUserTableName,
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

      jest.mocked(mockQueryDynamoDb).mockResolvedValue({
        $metadata: {},
        Items: [mockReaderUser],
      });

      await expect(
        userRepository.getUsersByRole(role),
      ).resolves.toEqual<GetUsersByRoleOutput>([mockReaderUser]);

      expect(mockQueryDynamoDb).toHaveBeenCalledWith<[QueryCommandInput]>({
        TableName: mockUserTableName,
        IndexName: mockUserTableRoleIndexName,
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': role },
        KeyConditionExpression: '#role = :role',
      });
    });
  });
});
