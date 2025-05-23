import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { GasPriceResponseDto } from './dtos/gas-price.dto';
import { THexString } from '@/types/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CacheService } from '../cache/cache.service';

export interface IGasPriceOptions {
  refresh?: boolean;
}

@Injectable()
export class GasPriceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GasPriceService.name);
  private updateInterval: NodeJS.Timeout;

  constructor(
    private cacheService: CacheService,
    private configService: ConfigService,
    private blockchainService: BlockchainService,
  ) {}

  async onModuleInit() {
    try {
      const { gasPrice } = await this.getGasPrice();
      this.logger.verbose(`Initial gas price: ${gasPrice}`);
    } catch (error) {
      this.logger.error('Failed to fetch initial gas price:', error);
    }

    await this.startGasPriceUpdates();
  }

  async onModuleDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval.unref();
    }
  }

  async getGasPrice({
    refresh = false,
  }: IGasPriceOptions = {}): Promise<GasPriceResponseDto> {
    const cacheKey = 'gas-price:current';

    if (!refresh) {
      const cachedPrice = await this.cacheService.get<THexString>(cacheKey);
      if (cachedPrice) {
        return { gasPrice: cachedPrice };
      }
    }

    const gasPrice = (await this.blockchainService.getFeeData()).gasPrice;

    if (!gasPrice) {
      throw new BadGatewayException('RPC node returned invalid gas price data');
    }

    const gasPriceHex: THexString = `0x${gasPrice.toString(16)}`;

    await this.cacheService.set(
      cacheKey,
      gasPriceHex,
      this.configService.get('GAS_MONITORING_INTERVAL'),
    );

    return { gasPrice: gasPriceHex };
  }

  // Background job to update gas price periodically
  async startGasPriceUpdates() {
    this.updateInterval = setInterval(async () => {
      try {
        const { gasPrice } = await this.getGasPrice({ refresh: true });
        this.logger.verbose(`Gas price updated: ${gasPrice}`);
      } catch (error) {
        this.logger.error('Failed to update gas price:', error);
      }
    }, this.configService.get('GAS_MONITORING_INTERVAL'));

    // Ensure the interval doesn't keep the process alive
    this.updateInterval.unref();
  }
}
