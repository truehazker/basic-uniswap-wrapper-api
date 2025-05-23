import { Test, TestingModule } from '@nestjs/testing';
import { GasPriceService } from '@/modules/gas-price/gas-price.service';
import { ConfigService } from '@/modules/config/config.service';
import { BadGatewayException, Logger } from '@nestjs/common';
import { ConfigModule } from '@modules/config/config.module';
import { BlockchainModule } from '@modules/blockchain/blockchain.module';
import { CacheModule } from '@modules/cache/cache.module';
import { CacheService } from '@modules/cache/cache.service';
import { BlockchainService } from '@modules/blockchain/blockchain.service';

describe('GasPriceService', () => {
  let service: GasPriceService;
  let cacheService: CacheService;
  let blockchainService: BlockchainService;
  let loggerSpy: jest.SpyInstance;
  let configService: ConfigService;

  const mockGasPrice = BigInt('50000000000'); // 50 gwei

  beforeEach(async () => {
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, BlockchainModule, CacheModule],
      providers: [GasPriceService],
    }).compile();

    service = module.get<GasPriceService>(GasPriceService);
    configService = module.get<ConfigService>(ConfigService);
    cacheService = module.get<CacheService>(CacheService);
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    if (loggerSpy) {
      loggerSpy.mockRestore();
    }
  });

  describe('onModuleInit', () => {
    it('should fetch initial gas price on module init', async () => {
      jest.spyOn(blockchainService, 'getFeeData').mockResolvedValueOnce({
        gasPrice: mockGasPrice,
      });
      jest.spyOn(cacheService, 'set').mockResolvedValueOnce();

      await service.onModuleInit();

      expect(blockchainService.getFeeData).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        `0x${mockGasPrice.toString(16)}`,
        expect.any(Number),
      );
    });

    it('should handle errors during initial gas price fetch', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      jest
        .spyOn(blockchainService, 'getFeeData')
        .mockRejectedValueOnce(new Error('RPC error'));
      jest.spyOn(cacheService, 'set').mockResolvedValueOnce();

      await service.onModuleInit();

      expect(blockchainService.getFeeData).toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear update interval on module destroy', async () => {
      jest.spyOn(blockchainService, 'getFeeData').mockResolvedValueOnce({
        gasPrice: mockGasPrice,
      });
      jest.spyOn(cacheService, 'set').mockResolvedValueOnce();

      await service.onModuleInit();

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      await service.onModuleDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('getGasPrice', () => {
    it('should return cached gas price when available', async () => {
      const cachedGasPrice = '0x1234';
      jest.spyOn(cacheService, 'get').mockResolvedValueOnce(cachedGasPrice);
      const getFeeDataSpy = jest.spyOn(blockchainService, 'getFeeData');

      const result = await service.getGasPrice();

      expect(result).toEqual({ gasPrice: cachedGasPrice });
      expect(getFeeDataSpy).not.toHaveBeenCalled();
    });

    it('should fetch new gas price when cache is empty', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
      jest.spyOn(blockchainService, 'getFeeData').mockResolvedValueOnce({
        gasPrice: mockGasPrice,
      });
      jest.spyOn(cacheService, 'set').mockResolvedValueOnce();

      const result = await service.getGasPrice();

      expect(result).toEqual({ gasPrice: `0x${mockGasPrice.toString(16)}` });
      expect(blockchainService.getFeeData).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should fetch new gas price when refresh is true', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValueOnce('0x1234');
      jest.spyOn(blockchainService, 'getFeeData').mockResolvedValueOnce({
        gasPrice: mockGasPrice,
      });
      jest.spyOn(cacheService, 'set').mockResolvedValueOnce();

      const result = await service.getGasPrice({ refresh: true });

      expect(result).toEqual({ gasPrice: `0x${mockGasPrice.toString(16)}` });
      expect(blockchainService.getFeeData).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should throw BadGatewayException when gas price is null', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      jest.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
      jest.spyOn(blockchainService, 'getFeeData').mockResolvedValueOnce({
        gasPrice: null,
      });

      await expect(service.getGasPrice()).rejects.toThrow(BadGatewayException);
    });

    it('should throw BadGatewayException when RPC call fails', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      jest.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
      jest
        .spyOn(blockchainService, 'getFeeData')
        .mockRejectedValueOnce(new Error('RPC error'));

      await expect(service.getGasPrice()).rejects.toThrow('RPC error');
    });
  });

  describe('startGasPriceUpdates', () => {
    it('should update gas price periodically', async () => {
      jest.spyOn(blockchainService, 'getFeeData').mockResolvedValue({
        gasPrice: mockGasPrice,
      });
      jest.spyOn(cacheService, 'set').mockResolvedValue();

      // Start the updates
      await service.startGasPriceUpdates();

      // Fast-forward time to trigger interval
      await jest.advanceTimersByTimeAsync(
        configService.get('GAS_MONITORING_INTERVAL'),
      );

      expect(blockchainService.getFeeData).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        `0x${mockGasPrice.toString(16)}`,
        expect.any(Number),
      );
    });

    it('should handle errors during periodic updates', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      jest
        .spyOn(blockchainService, 'getFeeData')
        .mockRejectedValue(new Error('RPC error'));
      jest.spyOn(cacheService, 'set').mockResolvedValue();

      // Start the updates
      await service.startGasPriceUpdates();

      // Fast-forward time to trigger interval
      await jest.advanceTimersByTimeAsync(
        configService.get('GAS_MONITORING_INTERVAL'),
      );

      expect(blockchainService.getFeeData).toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });
});
