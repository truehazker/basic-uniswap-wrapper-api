import { z } from 'zod';

export const configSchema = z.object({
  LOG_LEVEL: z
    .string()
    .transform((val) => val.split(',').map((level) => level.trim()))
    .pipe(z.array(z.enum(['log', 'error', 'warn', 'debug', 'verbose'])))
    .default('log,error,warn,debug,verbose'),

  SERVER_HOST: z
    .string()
    .regex(/^[a-z0-9-.]+$/i)
    .default('0.0.0.0'),
  SERVER_PORT: z.string().regex(/^\d+$/).transform(Number).default('9090'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),

  RPC_URL: z.string().url(),

  GAS_MONITORING_INTERVAL: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('1000'),

  UNISWAP_FACTORY_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .default('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'),

  PAIR_CACHE_TTL: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('3600000'),
});

export type TConfig = z.infer<typeof configSchema>;
