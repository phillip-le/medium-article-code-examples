import type { User } from '../../user.type';

import { createUserEntity } from './user.entity.private';

describe('User Entity', () => {
  it('should create user based on input and generate readonly properties', () => {
    const mockUserId = 'TestUserId';
    const mockTimestamp = '2023-09-10T05:58:16.945Z';

    const createUserEntityInjected = createUserEntity({
      createUserId: () => mockUserId,
      getCreatedTime: () => new Date(mockTimestamp),
    });

    const createdUser = createUserEntityInjected({
      email: 'TestUserEmail',
      role: 'ADMIN',
    });

    expect(createdUser).toEqual<User>({
      id: mockUserId,
      email: 'TestUserEmail',
      role: 'ADMIN',
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    });
  });
});
