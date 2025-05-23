import { Module } from '@nestjs/common';
import { UniswapController } from './uniswap.controller';
import { UniswapService } from './uniswap.service';
import { ConfigModule } from '../config/config.module';
import { GasPriceModule } from '../gas-price/gas-price.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ConfigModule, GasPriceModule, BlockchainModule, CacheModule],
  controllers: [UniswapController],
  providers: [UniswapService],
  exports: [UniswapService],
})
export class UniswapModule {}
