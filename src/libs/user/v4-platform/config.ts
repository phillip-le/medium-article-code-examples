import { z } from 'zod';

const environmentSchema = z.enum([
  'development',
  'production',
  'test',
  'local',
]);

const environmentConfigSchema = z.object({
  environment: environmentSchema,
  userTableName: z.string(),
  userTableRoleIndexName: z.string(),
  dynamoDbOptions: z.object({
    region: z.string(),
    endpoint: z.string().optional(),
  }),
});

export type EnvironmentConfig = z.infer<typeof environmentConfigSchema>;

export const getConfig = (): EnvironmentConfig => {
  const environment = environmentSchema.parse(process.env.ENVIRONMENT);

  return environmentConfigSchema.parse({
    environment,
    userTableName: 'User',
    userTableRoleIndexName: 'RoleIndex',
    ...(environment === 'production' || environment === 'development'
      ? {
          dynamoDbOptions: {
            region: 'ap-southeast-2',
          },
        }
      : {
          dynamoDbOptions: {
            region: 'ap-southeast-2',
            endpoint: 'http://localhost:8000',
          },
        }),
  });
};

export const config = getConfig();
