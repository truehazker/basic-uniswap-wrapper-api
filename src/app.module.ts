import { Module } from '@nestjs/common';
import { ConfigModule } from '@modules/config/config.module';
import { GasPriceModule } from '@modules/gas-price/gas-price.module';
import { UniswapModule } from '@modules/uniswap/uniswap.module';

@Module({
  imports: [ConfigModule, GasPriceModule, UniswapModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
