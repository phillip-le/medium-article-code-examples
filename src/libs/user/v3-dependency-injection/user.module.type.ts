import type {
  CreateUserInput,
  GetUsersByRoleOutput,
  Role,
  User,
} from '../user.type';

export type PersistUser = (input: User) => Promise<void>;

export type GetUsersByRole = (role: Role) => Promise<GetUsersByRoleOutput>;

export type UserRepository = {
  persistUser: PersistUser;
  getUsersByRole: GetUsersByRole;
};

export type CreateUserId = () => string;

export type CreateUserEntity = (createUserInput: CreateUserInput) => User;
