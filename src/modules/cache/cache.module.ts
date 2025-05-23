import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.register({
      ttl: 10000, // 10 seconds
      max: 100, // maximum number of items in cache
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
