import { randomUUID } from 'crypto';

import type {
  CreateUserInput,
  GetUsersByRoleOutput,
  Role,
  User,
} from 'src/libs/user/user.type';

import { createUserDynamoDb, getUsersByRoleDynamoDb } from './user.repository';
import { createUser } from './user.use-case';

jest.mock('crypto');
jest.mock('./user.repository');

describe('User use cases', () => {
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
    it('should create user based on input and generate readonly properties', async () => {
      const mockTime = '2023-01-01T00:00:00.000Z';
      jest.setSystemTime(new Date(mockTime));

      const mockUserId = '9aebce78-f438-46bb-917d-f0361015a8e9';
      jest.mocked(randomUUID).mockReturnValue(mockUserId);

      jest.mocked(createUserDynamoDb).mockResolvedValue();

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

      expect(createUserDynamoDb).toHaveBeenCalledWith<[User]>({
        id: mockUserId,
        email: mockUserInput.email,
        role: mockUserInput.role,
        createdAt: mockTime,
        updatedAt: mockTime,
      });
    });
  });

  describe('getUsersByRole', () => {
    it('should get users by role', async () => {
      const role: Role = 'ADMIN';

      const mockUser: User = {
        id: 'TestUserId',
        email: 'TestUserEmail',
        role,
        createdAt: '2023-09-10T05:58:16.945Z',
        updatedAt: '2023-09-10T05:58:16.945Z',
      };

      jest.mocked(getUsersByRoleDynamoDb).mockResolvedValueOnce([mockUser]);

      await expect(
        getUsersByRoleDynamoDb(role),
      ).resolves.toEqual<GetUsersByRoleOutput>([mockUser]);

      expect(getUsersByRoleDynamoDb).toHaveBeenCalledWith<[Role]>(role);
    });
  });
});
