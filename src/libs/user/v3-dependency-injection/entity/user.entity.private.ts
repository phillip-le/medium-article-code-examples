import type { CreateUserInput, User } from '../../user.type';
import type { CreateUserEntity } from '../user.module.type';

export const createUserEntity =
  ({
    getCreatedTime,
    createUserId,
  }: {
    getCreatedTime: () => Date;
    createUserId: () => string;
  }): CreateUserEntity =>
  (userInput: CreateUserInput): User => {
    const userId = createUserId();
    const createdAt = getCreatedTime().toISOString();

    return {
      id: userId,
      email: userInput.email,
      role: userInput.role,
      createdAt,
      updatedAt: createdAt,
    };
  };
