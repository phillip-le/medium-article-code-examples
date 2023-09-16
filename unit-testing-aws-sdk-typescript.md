# Unit testing TypeScript AWS SDK

Take a look at the source code in [GitHub](https://github.com/phillip-le/aws-sdk-testing).

## Unit testing with AWS SDK v3 using aws-sdk-client-mock

I'll use a simple CRUD application which creates a user account and persists it to DynamoDB using AWS SDK v3 as an example.
DynamoDB has a few libraries like `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`. `@aws-sdk/client-dynamodb` is
generally used for table level commands such as `CreateTableCommand` and `DescribeTableCommand`. For CRUD operations,
it helpful to use `@aws-sdk/lib-dynamodb` which automatically handles marshalling and unmarshalling javascript objects to [DynamoDB JSON](https://docs.aws.amazon.com/whitepapers/latest/comparing-dynamodb-and-hbase-for-nosql/data-types.html).

```shell
yarn add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

You can initialise the DynamoDB client in its own file and export it globally so you can use it throughout your application:

```ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const dynamoDbClient = new DynamoDBClient({ region: 'ap-southeast-2' });

export const dynamoDbDocumentClient =
  DynamoDBDocumentClient.from(dynamoDbClient);
```

[Source](./src/libs/aws-sdk-v3/dynamodb.ts)

We can create a user object and persist it to DynamoDB with the `PutCommand`:

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

  await dynamoDbDocumentClient.send(
    new PutCommand({
      TableName: config.userTableName,
      Item: userToCreate,
    }),
  );

  return userToCreate;
};
```

[Source](./src/libs/user/v1-simple/aws-sdk-v3/user.service.ts)

To test this we can use the [aws-sdk-client-mock](https://www.npmjs.com/package/aws-sdk-client-mock) library which provides a simple way to mock AWS SDK v3 clients:

```shell
yarn add -D aws-sdk-client-mock
```

In our test file, we can then mock the DynamoDB Document Client that we created earlier.

```ts
import { mockClient } from 'aws-sdk-client-mock';

const mockDynamoDbDocumentClient = mockClient(dynamoDbDocumentClient);
```

In our test case, we can setup the expected response from the `PutCommand`:

```ts
it('should create user with readonly properties and put in dynamodb', async () => {
  mockDynamoDbDocumentClient.on(PutCommand).resolves({});
});
```

[Source](./src/libs/user/v1-simple/aws-sdk-v3/user.service.test.ts)

For creating a user, we do not use the response from the `PutCommand` so we can just return an empty object.

On the other hand, if we wanted to get a list of users by their role:

```ts
export const getUsersByRole = async (
  role: Role,
): Promise<GetUsersByRoleOutput> => {
  const { Items: users } = await dynamoDbDocumentClient.send(
    new QueryCommand({
      TableName: config.userTableName,
      IndexName: config.userTableRoleIndexName,
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': role },
      KeyConditionExpression: '#role = :role',
    }),
  );

  if (!maybeUsers) {
    return [];
  }

  return users as User[];
};
```

[Source](./src/libs/user/v1-simple/aws-sdk-v3/user.service.ts)

We would need to setup the list users that DynamoDB would return:

```ts
it('should query user by role from dynamodb', async () => {
  const role: Role = 'READER';

  const mockReaderUser: User = {
    id: 'TestUserId',
    email: 'test@email.com',
    role,
    createdAt: '2023-09-10T05:58:16.945Z',
    updatedAt: '2023-09-10T05:58:16.945Z',
  };

  mockDynamoDbDocumentClient.on(QueryCommand).resolves({
    Items: [mockReaderUser],
  });
});
```

[Source](./src/libs/user/v1-simple/aws-sdk-v3/user.service.test.ts)

We also want to assert that we are giving the DynamoDB client commands with the correct parameters, for example with the `PutCommand` we want to use
the correct table name and the user we expect to create. We can use the custom jest matchers provided by [aws-sdk-client-mock-jest](https://www.npmjs.com/package/aws-sdk-client-mock#jest-matchers) to do this:

```shell
yarn add -D aws-sdk-client-mock-jest
```

Make sure to import `aws-sdk-client-mock-jest` at the top of your test file:

```ts
import 'aws-sdk-client-mock-jest';
```

Then, we can use the `toHaveReceivedCommandWith` matcher to assert that the client has received a `PutCommand` with the correct parameters:

```ts
it('should persist user to dynamodb', async () => {
  await createUser(userInput);

  expect(mockDynamoDbDocumentClient).toHaveReceivedCommandWith(PutCommand, {
    TableName: 'TestUserTable',
    Item: userToCreate,
  });
});
```

[Source](./src/libs/user/v1-simple/aws-sdk-v3/user.service.test.ts)

Similarly, we can use the `toHaveReceivedCommandWith` matcher to assert that the client has received a `QueryCommand` with the correct parameters:

```ts
it('should query user by role from dynamodb', async () => {
  expect(mockDynamoDbDocumentClient).toHaveReceivedCommandWith(QueryCommand, {
    TableName: config.userTableName,
    IndexName: config.userTableRoleIndexName,
    ExpressionAttributeNames: { '#role': 'role' },
    ExpressionAttributeValues: { ':role': role },
    KeyConditionExpression: '#role = :role',
  });
});
```

[Source](./src/libs/user/v1-simple/aws-sdk-v3/user.service.test.ts)

## Comparing testing approach to AWS SDK v2

`aws-sdk-client-mock` makes it very easy to unit test AWS SDK v3. However, the testability of our implementation
is highly reliant on `aws-sdk-client-mock`. If we look at how our unit tests would have been implemented
in AWS SDK v2 where an equivalent library did not exist, we can see that our tests require more setup and understanding of `jest` mocking.

This is how we would query users by their role in AWS SDK v2:

```ts
const { Items: maybeUsers } = await dynamoDbDocumentClient
  .query({
    TableName: config.userTableName,
    IndexName: config.userTableRoleIndexName,
    ExpressionAttributeNames: { '#role': 'role' },
    ExpressionAttributeValues: { ':role': role },
    KeyConditionExpression: '#role = :role',
  })
  .promise();
```

[Source](./src/libs/user/v1-simple/aws-sdk-v2/user.service.ts)

Notice that AWS SDK v2 does not support promises initially, so we need to call the `promise` method to get a promise. This
makes mocking more complex:

```ts
it('should query user by role from dynamodb', async () => {
  const mockReaderUser: User = {
    id: 'TestUserId',
    email: 'test@email.com',
    role: 'READER',
    createdAt: '2023-09-10T05:58:16.945Z',
    updatedAt: '2023-09-10T05:58:16.945Z',
  };

  const mockQueryDynamoDb = jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({ Items: [mockReaderUser] }),
  }));
  jest
    .spyOn(dynamoDbDocumentClient, 'query')
    .mockImplementation(mockQueryDynamoDb);

  await expect(getUsersByRole('READER')).resolves.toEqual([mockReaderUser]);

  expect(mockQueryDynamoDb).toHaveBeenCalledWith<
    [DynamoDB.DocumentClient.QueryInput]
  >({
    TableName: config.userTableName,
    IndexName: config.userTableRoleIndexName,
    ExpressionAttributeNames: { '#role': 'role' },
    ExpressionAttributeValues: { ':role': mockReaderUser.role },
    KeyConditionExpression: '#role = :role',
  });
});
```

[Source](./src/libs/user/v1-simple/aws-sdk-v2/user.service.test.ts)

We can see above that while it is possible to unit test AWS SDK v2, it was not intuitive how to do so.
Ideally, the testability of our application should not be heavily reliant on the implementation details of third party libraries.

## Wrapping the AWS SDK client methods

One of the core challenges of testing the AWS SDK library is that the client methods are not easily mockable. `jest` tends
to be simpler when mocking functions as opposed to classes. We can wrap the AWS SDK v3 client methods in functions which
pass the parameters to the client method and return the results.

```ts
export const queryDynamoDb = async (
  params: QueryCommandInput,
): Promise<QueryCommandOutput> =>
  await dynamoDbDocumentClient.send(new QueryCommand(params));
```

[Source](./src/libs/aws-sdk-v3/dynamodb.ts)

One of the key considerations is that this wrapper function should not add additional logic, so that we are effectively testing at the same level
as before.

Using our wrapper looks like this:

```ts
export const getUsersByRoleDynamoDb = async (
  role: Role,
): Promise<GetUsersByRoleOutput> => {
  const { Items: users } = await queryDynamoDb({
    TableName: config.userTableName,
    IndexName: config.userTableRoleIndexName,
    ExpressionAttributeNames: { '#role': 'role' },
    ExpressionAttributeValues: { ':role': role },
    KeyConditionExpression: '#role = :role',
  });

  if (!users) {
    return [];
  }

  return users as User[];
};
```

The `queryDynamoDb` wrapper function is much easier to mock than the `send` method of the `DynamoDBDocumentClient` class.

In our test file, we first mock the file that exports the AWS SDK wrapper functions:

```ts
jest.mock('../../aws-sdk-v3/dynamodb');
```

This replaces all the functions exported by the file with mock functions. Then, we can mock the `queryDynamoDb` function using `jest.mocked`:

```ts
it('should query user by role from dynamodb', async () => {
  const role: Role = 'READER';

  const mockReaderUser: User = {
    ...mockUser,
    role,
  };

  jest.mocked(queryDynamoDb).mockResolvedValue({
    $metadata: {},
    Items: [mockReaderUser],
  });
});
```

[Source](./src/libs/user/v2-some-layers/user.repository.test.ts)

We can also assert that `queryDynamoDb` was called with the correct parameters easily with `toHaveBeenCalledWith`:

```ts
it('should query user by role from dynamodb', async () => {
  expect(queryDynamoDb).toHaveBeenCalledWith<[QueryCommandInput]>({
    TableName: config.userTableName,
    IndexName: config.userTableRoleIndexName,
    ExpressionAttributeNames: { '#role': 'role' },
    ExpressionAttributeValues: { ':role': role },
    KeyConditionExpression: '#role = :role',
  });
});
```

This way our implementation is not reliant on third party libraries like `aws-sdk-client-mock` and we can use standard `jest` mocking.

If we used AWS SDK v2, `queryDynamoDb` would look like this:

```ts
export const queryDynamoDb = async (
  params: DynamoDB.DocumentClient.QueryInput,
): Promise<DynamoDB.DocumentClient.QueryOutput> =>
  await dynamoDbDocumentClient.query(params).promise();
```

[Source](./src/libs/aws-sdk-v2/dynamodb.ts)

But our tests would look the same.
