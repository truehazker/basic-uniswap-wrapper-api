import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GasPriceController } from './gas-price.controller';
import { GasPriceService } from './gas-price.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 10000, // 10 seconds
      max: 100, // maximum number of items in cache
    }),
    ConfigModule,
  ],
  controllers: [GasPriceController],
  providers: [GasPriceService],
  exports: [GasPriceService],
})
export class GasPriceModule {}
