import { randomUUID } from 'crypto';

import type {
  PutCommandInput,
  PutCommandOutput,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';

import type { User } from '../user.type';

import { documentClient } from './documentClient';
import { createUser, getUsersByRole } from './user.repository';

jest.mock('./documentClient');
jest.mock('crypto');

describe('UserRepository', () => {
  const currentTime = new Date('2023-01-01T00:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(currentTime);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create a user', async () => {
    jest
      // Resolves `Argument of type 'PutCommandOutput' is not assignable to parameter of type 'never'.ts(2345)`
      .mocked(documentClient.put as () => Promise<PutCommandOutput>)
      .mockResolvedValueOnce({} as PutCommandOutput);
    jest
      .mocked(randomUUID)
      .mockReturnValue('9aebce78-f438-46bb-917d-f0361015a8e9');

    await createUser({ email: 'test@test.com', role: 'ADMIN' });

    expect(documentClient.put).toHaveBeenCalledWith<[PutCommandInput]>({
      TableName: 'User',
      Item: {
        id: '9aebce78-f438-46bb-917d-f0361015a8e9',
        email: 'test@test.com',
        role: 'ADMIN',
        createdAt: currentTime.toISOString(),
        updatedAt: currentTime.toISOString(),
      },
    });
  });

  it('should get users by role', async () => {
    const expectedUsers: User[] = [
      {
        id: '9aebce78-f438-46bb-917d-f0361015a8e9',
        email: 'test@test.com',
        role: 'ADMIN',
        createdAt: currentTime.toISOString(),
        updatedAt: currentTime.toISOString(),
      },
    ];
    const queryCommandOutput: Partial<QueryCommandOutput> = {
      Items: expectedUsers,
    };
    jest
      // Resolves `Argument of type 'QueryCommandOutput' is not assignable to parameter of type 'never'.ts(2345)`
      .mocked(documentClient.query as () => Promise<QueryCommandOutput>)
      .mockResolvedValueOnce(queryCommandOutput as QueryCommandOutput);

    const users = await getUsersByRole('ADMIN');

    expect(users).toEqual<Awaited<ReturnType<typeof getUsersByRole>>>(
      expectedUsers,
    );

    expect(documentClient.query).toHaveBeenCalledWith<[QueryCommandInput]>({
      TableName: 'User',
      IndexName: 'RoleIndex',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': 'ADMIN' },
      KeyConditionExpression: '#role = :role',
    });
  });
});
