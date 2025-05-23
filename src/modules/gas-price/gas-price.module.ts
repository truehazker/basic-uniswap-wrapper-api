import { Module } from '@nestjs/common';
import { GasPriceController } from './gas-price.controller';
import { GasPriceService } from './gas-price.service';
import { ConfigModule } from '../config/config.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ConfigModule, BlockchainModule, CacheModule],
  controllers: [GasPriceController],
  providers: [GasPriceService],
  exports: [GasPriceService],
})
export class GasPriceModule {}
