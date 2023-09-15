import { randomUUID } from 'crypto';

import type {
  CreateUserInput,
  GetUsersByRoleOutput,
  Role,
  User,
} from '../user.type';

import { createUserDynamoDb, getUsersByRoleDynamoDb } from './user.repository';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const createdAt = new Date().toISOString();

  const userToCreate: User = {
    id: randomUUID(),
    email: input.email,
    role: input.role,
    createdAt,
    updatedAt: createdAt,
  };

  await createUserDynamoDb(userToCreate);

  return userToCreate;
};

export const getUsersByRole = async (
  role: Role,
): Promise<GetUsersByRoleOutput> => await getUsersByRoleDynamoDb(role);
