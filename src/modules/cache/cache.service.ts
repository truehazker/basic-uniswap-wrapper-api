import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cache.get<T>(key);
    return value ?? undefined;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }
}
