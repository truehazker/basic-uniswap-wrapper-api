import { Test, TestingModule } from '@nestjs/testing';
import { GasPriceService } from '@/modules/gas-price/gas-price.service';
import { ConfigService } from '@/modules/config/config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadGatewayException, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ethers } from 'ethers';

describe('GasPriceService', () => {
  let service: GasPriceService;
  let cacheManager: Cache;
  let mockProvider: { getFeeData: jest.Mock };
  let loggerSpy: jest.SpyInstance;

  const mockConfig = {
    RPC_URL: 'https://mock-rpc-url',
    GAS_MONITORING_INTERVAL: 10000,
  } as const;

  const mockGasPrice = BigInt('50000000000'); // 50 gwei

  beforeEach(async () => {
    jest.useFakeTimers();

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    // Mock the JsonRpcProvider
    mockProvider = {
      getFeeData: jest.fn().mockResolvedValue({
        gasPrice: mockGasPrice,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      }),
    };

    jest
      .spyOn(ethers, 'JsonRpcProvider')
      .mockImplementation(
        () => mockProvider as unknown as ethers.JsonRpcProvider,
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GasPriceService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof typeof mockConfig) => mockConfig[key]),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<GasPriceService>(GasPriceService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
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
      await service.onModuleInit();

      expect(mockProvider.getFeeData).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        `0x${mockGasPrice.toString(16)}`,
        expect.any(Number),
      );
    });

    it('should handle errors during initial gas price fetch', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      mockProvider.getFeeData.mockRejectedValueOnce(new Error('RPC error'));

      await service.onModuleInit();

      expect(mockProvider.getFeeData).toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear update interval on module destroy', async () => {
      await service.onModuleInit();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      await service.onModuleDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('getGasPrice', () => {
    it('should return cached gas price when available', async () => {
      const cachedGasPrice = '0x1234';
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(cachedGasPrice);

      const result = await service.getGasPrice();

      expect(result).toEqual({ gasPrice: cachedGasPrice });
      expect(mockProvider.getFeeData).not.toHaveBeenCalled();
    });

    it('should fetch new gas price when cache is empty', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);

      const result = await service.getGasPrice();

      expect(result).toEqual({ gasPrice: `0x${mockGasPrice.toString(16)}` });
      expect(mockProvider.getFeeData).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should fetch new gas price when refresh is true', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce('0x1234');

      const result = await service.getGasPrice({ refresh: true });

      expect(result).toEqual({ gasPrice: `0x${mockGasPrice.toString(16)}` });
      expect(mockProvider.getFeeData).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should throw BadGatewayException when gas price is null', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);
      mockProvider.getFeeData.mockResolvedValueOnce({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      });

      await expect(service.getGasPrice()).rejects.toThrow(BadGatewayException);
    });

    it('should throw BadGatewayException when RPC call fails', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);
      mockProvider.getFeeData.mockRejectedValueOnce(new Error('RPC error'));

      await expect(service.getGasPrice()).rejects.toThrow('RPC error');
    });
  });

  describe('startGasPriceUpdates', () => {
    it('should update gas price periodically', async () => {
      // Start the updates
      await service.startGasPriceUpdates();

      // Fast-forward time to trigger interval
      await jest.advanceTimersByTimeAsync(mockConfig.GAS_MONITORING_INTERVAL);

      expect(mockProvider.getFeeData).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        `0x${mockGasPrice.toString(16)}`,
        expect.any(Number),
      );
    });

    it('should handle errors during periodic updates', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      mockProvider.getFeeData.mockRejectedValueOnce(new Error('RPC error'));

      // Start the updates
      await service.startGasPriceUpdates();

      // Fast-forward time to trigger interval
      await jest.advanceTimersByTimeAsync(mockConfig.GAS_MONITORING_INTERVAL);

      expect(mockProvider.getFeeData).toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });
});
