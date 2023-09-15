import type {
  CreateUserInput,
  GetUsersByRoleOutput,
  Role,
  User,
} from '../../user.type';
import type {
  CreateUserEntity,
  GetUsersByRole,
  PersistUser,
} from '../user.module.type';

export const createUserUseCase =
  ({
    persistUser,
    createUserEntity,
  }: {
    persistUser: PersistUser;
    createUserEntity: CreateUserEntity;
  }) =>
  async (input: CreateUserInput): Promise<User> => {
    const user = createUserEntity(input);

    await persistUser(user);

    return user;
  };

export const getUsersByRoleUseCase =
  (getUsersByRole: GetUsersByRole) =>
  async (role: Role): Promise<GetUsersByRoleOutput> =>
    await getUsersByRole(role);
