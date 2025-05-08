import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { configSchema, TConfig } from '@/modules/config/const/config-schema.const';

/**
 * A service for accessing the application configuration.
 */
@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService<TConfig>) {}

  /**
   * Get a config value by key from the NestConfigService with type safety.
   * @param key - The key of the config value to get.
   */
  get<K extends keyof TConfig>(key: K): TConfig[K] {
    return this.nestConfigService.get(key)!;
  }

  /**
   * Validate the config object against the config schema.
   * @param config
   */
  static validateConfig(config: Record<string, unknown>): TConfig {
    return configSchema.parse(config);
  }
}
