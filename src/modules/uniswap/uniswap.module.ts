import { Module } from '@nestjs/common';
import { UniswapController } from './uniswap.controller';
import { UniswapService } from './uniswap.service';
import { ConfigModule } from '../config/config.module';
import { GasPriceModule } from '../gas-price/gas-price.module';

@Module({
  imports: [ConfigModule, GasPriceModule],
  controllers: [UniswapController],
  providers: [UniswapService],
  exports: [UniswapService],
})
export class UniswapModule {}
