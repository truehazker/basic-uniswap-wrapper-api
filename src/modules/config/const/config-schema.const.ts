import { z } from 'zod';

export const configSchema = z.object({
  SERVER_HOST: z
    .string()
    .regex(/^[a-z0-9-.]+$/i)
    .default('0.0.0.0'),
  SERVER_PORT: z.string().regex(/^\d+$/).transform(Number).default('9090'),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('production'),

  RPC_URL: z.string().url(),
});

export type TConfig = z.infer<typeof configSchema>;
