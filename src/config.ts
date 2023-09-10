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
  awsSdkV3Config: z.object({
    dynamoDb: z.object({
      region: z.string(),
      endpoint: z.string().optional(),
    }),
  }),
});

export type EnvironmentConfig = z.infer<typeof environmentConfigSchema>;

export const getConfig = (): EnvironmentConfig => {
  const environment = environmentSchema.parse(process.env.ENVIRONMENT);

  return environmentConfigSchema.parse({
    environment,
    userTableName: 'User',
    userTableRoleIndexName: 'RoleIndex',
    awsSdkV3Config:
      environment === 'production' || environment === 'development'
        ? {
            dynamoDb: {
              region: 'ap-southeast-2',
            },
          }
        : {
            dynamoDb: {
              region: 'ap-southeast-2',
              endpoint: 'http://localhost:8000',
            },
          },
  });
};

export const config = getConfig();
