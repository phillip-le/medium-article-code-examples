import type { CreateUserInput, User } from '../../user.type';
import type { GetUsersByRole, PersistUser } from '../user.module.type';

import {
  createUserUseCase,
  getUsersByRoleUseCase,
} from './user.use-case.private';

describe('User use cases', () => {
  describe('createUser', () => {
    it('should create user based on input and generate readonly properties', async () => {
      const mockPersistUser = jest.fn() as PersistUser;

      const createUserInput: CreateUserInput = {
        email: 'TestUserEmail',
        role: 'ADMIN',
      };
      const mockUser: User = {
        id: 'TestUserId',
        email: createUserInput.email,
        role: createUserInput.role,
        createdAt: '2023-09-10T05:58:16.945Z',
        updatedAt: '2023-09-10T05:58:16.945Z',
      };

      const createUserUseCaseInjected = createUserUseCase({
        persistUser: mockPersistUser,
        createUserEntity: () => mockUser,
      });

      await expect(createUserUseCaseInjected(createUserInput)).resolves.toEqual(
        mockUser,
      );

      expect(mockPersistUser).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getUsersByRole', () => {
    it('should get users by role', async () => {
      const mockUser: User = {
        id: 'TestUserId',
        email: 'TestUserEmail',
        role: 'ADMIN',
        createdAt: '2023-09-10T05:58:16.945Z',
        updatedAt: '2023-09-10T05:58:16.945Z',
      };

      const mockGetUsersByRole = jest.fn() as GetUsersByRole;
      jest.mocked(mockGetUsersByRole).mockResolvedValueOnce([mockUser]);

      await expect(
        getUsersByRoleUseCase(mockGetUsersByRole)('ADMIN'),
      ).resolves.toEqual([mockUser]);

      expect(mockGetUsersByRole).toHaveBeenCalledWith('ADMIN');
    });
  });
});
