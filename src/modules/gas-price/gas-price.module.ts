import { Module } from '@nestjs/common';
import { GasPriceController } from './gas-price.controller';
import { GasPriceService } from './gas-price.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [GasPriceController],
  providers: [GasPriceService],
  exports: [GasPriceService],
})
export class GasPriceModule {}
