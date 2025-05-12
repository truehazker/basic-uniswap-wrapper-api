import { Module } from '@nestjs/common';
import { ConfigModule } from '@modules/config/config.module';
import { GasPriceModule } from '@modules/gas-price/gas-price.module';
import { UniswapModule } from '@modules/uniswap/uniswap.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 10000, // 10 seconds
      max: 100, // maximum number of items in cache
      isGlobal: true,
    }),
    ConfigModule,
    GasPriceModule,
    UniswapModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
