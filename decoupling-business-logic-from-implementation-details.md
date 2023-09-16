One of the tradeoffs we make by directly referencing `putDynamoDb` is that our "business logic" of creating a user is coupled
with where the user data is persisted. Our business logic can be summarised as:

1. Create a user entity with a unique id, email, role, createdAt and updatedAt timestamps
2. Persist this user entity to DynamoDB

But does our implementation really need to know about DynamoDB? In particular, if we chose to persist the user to a different place,
our tests would need to change because at the moment, our tests check that we are using `putDynamoDb` with the correct `PutCommandInput`
which is a third party implementation detail.

# Decoupling business logic from implementation details

A simple way of decoupling our business logic from how the user is persisted is to use wrap the DynamoDB specific details in its own function
which does not require the consumer to understand anything about DynamoDB.

```ts
export const createUserDynamoDb = async (user: User): Promise<void> => {
  await putDynamoDb({
    TableName: config.userTableName,
    Item: user,
  });
};
```

[Source](./src/libs/user/v2-some-layers/user.repository.ts)

Now, our business logic just needs to pass a `User` object.

```ts
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
```

Now we move our mocks up a layer and mock the `createUserDynamoDb` function.

```ts
jest.mock('./user.repository');

it('should create user based on input and generate readonly properties', async () => {
  jest.mocked(createUserDynamoDb).mockResolvedValue();

  const mockUserInput: CreateUserInput = {
    email: 'TestUserEmail',
    role: 'ADMIN',
  };

  const expectedUser: User = {
    id: mockUserId,
    email: mockUserInput.email,
    role: mockUserInput.role,
    createdAt: mockTime,
    updatedAt: mockTime,
  };

  const createdUser = await createUser(mockUserInput);

  expect(createUserDynamoDb).toHaveBeenCalledWith<[User]>(expectedUser);
});
```

[Source](./src/libs/user/v2-some-layers/user.use-case.test.ts)

This approach is a little more verbose but it allows us to decouple our business logic from the implementation details of how the user is persisted.
This approach also tends to happen naturally as we add more and more logic into our use case and we refactor our code into separate functions. For example, we could

1. Create a user entity
2. Persist this user entity to DynamoDB
3. Return an error if the user already exists
4. Send a welcome email to the user
5. Send metrics for user creation

Unfortunately, one of the problems with this approach is that it is still very easy to allow third party implementation details to leak into our business logic.

## Using dependency injection

It is easier to avoid leaking third party implementation details into our business logic if we explicitly define function interfaces which
our business logic can use. It is also important that the shape of the interface is based on the needs of the business logic and not the implementation details.

```ts
type PersistUser = (user: User) => Promise<void>;
```

Now, our business logic can rely on the `PersistUser` interface instead of a concrete implementation.

```ts
export const createUserUseCase =
  ({ persistUser }: { persistUser: PersistUser }) =>
  async (input: CreateUserInput): Promise<User> => {
    const createdAt = new Date().toISOString();

    const userToCreate: User = {
      id: randomUUID(),
      email: input.email,
      role: input.role,
      createdAt,
      updatedAt: createdAt,
    };

    await persistUser(user);

    return user;
  };
```

We also described creating the user entity as a step in our business logic. So, we can abstract this into its own interface as well.

```ts
type CreateUserEntity = (input: CreateUserInput) => User;
```

Which we can then use in our business logic.

```ts
export const createUserUseCase =
  ({
    createUserEntity,
    persistUser,
  }: {
    createUserEntity: CreateUserEntity;
    persistUser: PersistUser;
  }) =>
  async (input: CreateUserInput): Promise<User> => {
    const userToCreate = createUserEntity(input);

    await persistUser(user);

    return user;
  };
```

[Source](./src/libs/user/v3-dependency-injection/user.use-case.ts)

Which makes our use case test easy to understand in terms of our original steps:

1. Create a user entity with a unique id, email, role, createdAt and updatedAt timestamps
2. Persist this user entity to DynamoDB

```ts
it('should create and persist user', async () => {
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
```

[Source](./src/libs/user/v3-dependency-injection/use-case/user.use-case.private.test.ts)

Dependency injection also makes it easy to inject test implementations which are typically hard to mock. For example, when
we create our user entity, we generate a timestamp of the current time implicitly using the `Date` class. `jest` provides a way to set the system time for
mocking the `Date` class but it requires more understanding of how to use `jest`.

```ts
beforeAll(() => {
  jest.useFakeTimers();
});

it('should create user based on input and generate readonly properties', async () => {
  const mockTime = '2023-01-01T00:00:00.000Z';
  jest.setSystemTime(new Date(mockTime));

  const mockUserInput: CreateUserInput = {
    email: 'TestUserEmail',
    role: 'ADMIN',
  };

  const createdUser = await createUser(mockUserInput);

  expect(createUserDynamoDb).toHaveBeenCalledWith<[User]>(
    expect.objectContaining({
      createdAt: mockTime,
      updatedAt: mockTime,
    }),
  );
});
```

[Source](./src/libs/user/v2-some-layers/user.use-case.test.ts)

On the other hand, with dependency injection we can rely on an interface which generates the current `Date` for us.

```ts
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
```

[Source](./src/libs/user/v3-dependency-injection/user.entity.ts)

Which makes our tests more straightforward with no additional `jest` knowledge required.

```ts
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
```

[Source](./src/libs/user/v3-dependency-injection/entity/user.entity.private.test.ts)

## Injecting dependencies statically

One of the challenges with dependency injection is determining where to inject the concrete implementations required by
a function. One approach is to have functions which rely on
