import * as Logic from './use-case/user.use-case.private';
import { createUserEntity } from './user.entity';
import { userRepository } from './user.repository';

export const createUserUseCase = Logic.createUserUseCase({
  persistUser: userRepository.persistUser,
  createUserEntity,
});

export const getUsersByRoleUseCase = Logic.getUsersByRoleUseCase(
  userRepository.getUsersByRole,
);
