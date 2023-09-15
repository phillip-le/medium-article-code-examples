import { randomUUID } from 'crypto';

import * as Logic from './entity/user.entity.private';

export const createUserEntity = Logic.createUserEntity({
  createUserId: randomUUID,
  getCreatedTime: () => new Date(),
});
