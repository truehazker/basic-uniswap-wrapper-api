import { Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger, ServiceUnavailableException, BadGatewayException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ethers } from 'ethers';
import { ConfigService } from '../config/config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GasPriceResponseDto } from './dtos/gas-price.dto';
import { THexString } from '@/types/common';

@Injectable()
export class GasPriceService implements OnModuleInit, OnModuleDestroy {
  private provider: ethers.JsonRpcProvider;
  private readonly CACHE_KEY = 'gas_price';
  private readonly CACHE_TTL: number;
  private readonly logger = new Logger(GasPriceService.name);
  private updateInterval: NodeJS.Timeout;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.CACHE_TTL = this.configService.get('GAS_MONITORING_INTERVAL');
  }

  async onModuleInit() {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get('RPC_URL'),
    );

    try {
      const { gasPrice } = await this.getGasPrice();
      this.logger.verbose(`Initial gas price fetched: ${gasPrice}`);
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

    this.provider.destroy();
  }

  async getGasPrice({refresh = false}: {refresh?: boolean} = {}): Promise<GasPriceResponseDto> {
    const cachedGasPrice = await this.cacheManager.get<THexString>(this.CACHE_KEY);

    if (cachedGasPrice && !refresh) {
      return { gasPrice: cachedGasPrice };
    }

    const gasPrice = (await this.provider.getFeeData()).gasPrice;

    if (!gasPrice) {
      throw new BadGatewayException('RPC node returned invalid gas price data');
    }

    const gasPriceInHex: THexString = `0x${gasPrice.toString(16)}`;

    await this.cacheManager.set<THexString>(this.CACHE_KEY, gasPriceInHex, this.CACHE_TTL);

    return { gasPrice: gasPriceInHex };
  }

  // Background job to update gas price periodically
  async startGasPriceUpdates() {
    this.updateInterval = setInterval(async () => {
      try {
        const { gasPrice } = await this.getGasPrice({ refresh: true });
        await this.cacheManager.set(this.CACHE_KEY, gasPrice);
        this.logger.verbose(`Gas price updated: ${gasPrice}`);
      } catch (error) {
        this.logger.error('Failed to update gas price:', error);
      }
    }, this.CACHE_TTL);
    
    // Ensure the interval doesn't keep the process alive
    this.updateInterval.unref();
  }
}
