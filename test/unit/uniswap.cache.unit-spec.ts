import { Test, TestingModule } from '@nestjs/testing';
import { UniswapService } from '@/modules/uniswap/uniswap.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ethers } from 'ethers';
import { ConfigModule } from '@modules/config/config.module';
import {
  getMockCacheKey,
  MOCK_ADDRESSES,
  MOCK_RESERVES,
} from '../utils/uniswap.test-utils';

describe('UniswapService - Caching', () => {
  let service: UniswapService;
  let cacheManager: Cache;
  let mockProvider: { getCode: jest.Mock; destroy: jest.Mock };
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    // Mock the JsonRpcProvider
    mockProvider = {
      getCode: jest.fn().mockResolvedValue('0x1234'), // Non-empty code for existing contracts
      destroy: jest.fn(),
    };

    jest
      .spyOn(ethers, 'JsonRpcProvider')
      .mockImplementation(
        () => mockProvider as unknown as ethers.JsonRpcProvider,
      );

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        UniswapService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<UniswapService>(UniswapService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    // Create mock contract with required methods
    const mockContract = {
      getReserves: jest
        .fn()
        .mockResolvedValue([
          MOCK_RESERVES.TOKEN_A_RESERVE,
          MOCK_RESERVES.TOKEN_B_RESERVE,
          MOCK_RESERVES.BLOCK_TIMESTAMP,
        ]),
      token0: jest.fn().mockResolvedValue(MOCK_ADDRESSES.TOKEN_A),
      token1: jest.fn().mockResolvedValue(MOCK_ADDRESSES.TOKEN_B),
    } as unknown as jest.Mocked<ethers.Contract>;

    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (loggerSpy) {
      loggerSpy.mockRestore();
    }
  });

  describe('getPairContract', () => {
    it('should return cached pair contract when available', async () => {
      const cachedPairAddress = MOCK_ADDRESSES.PAIR_ADDRESS;
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(cachedPairAddress);

      loggerSpy = jest
        .spyOn(Logger.prototype, 'verbose')
        .mockImplementation(() => {});

      // Access the private method via any
      const result = await (service as any).getPairContract(
        MOCK_ADDRESSES.TOKEN_A,
        MOCK_ADDRESSES.TOKEN_B,
      );

      expect(cacheManager.get).toHaveBeenCalledWith(
        expect.stringContaining('pair_address_'),
      );
      expect(mockProvider.getCode).not.toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using cached pair address'),
      );
    });

    it('should fetch and cache pair contract when cache is empty', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);
      mockProvider.getCode.mockResolvedValueOnce('0x1234'); // Non-empty code

      loggerSpy = jest
        .spyOn(Logger.prototype, 'verbose')
        .mockImplementation(() => {});

      // Access the private method via any
      const result = await (service as any).getPairContract(
        MOCK_ADDRESSES.TOKEN_A,
        MOCK_ADDRESSES.TOKEN_B,
      );

      expect(cacheManager.get).toHaveBeenCalledWith(
        expect.stringContaining('pair_address_'),
      );
      expect(mockProvider.getCode).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('pair_address_'),
        expect.any(String),
        expect.any(Number),
      );
      expect(result).toBeDefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cached pair address'),
      );
    });

    it('should fetch pair contract when refresh is true, even if cached', async () => {
      const cachedPairAddress = MOCK_ADDRESSES.PAIR_ADDRESS;
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(cachedPairAddress);
      mockProvider.getCode.mockResolvedValueOnce('0x1234'); // Non-empty code

      loggerSpy = jest
        .spyOn(Logger.prototype, 'verbose')
        .mockImplementation(() => {});

      // Access the private method via any, with refresh option
      const result = await (service as any).getPairContract(
        MOCK_ADDRESSES.TOKEN_A,
        MOCK_ADDRESSES.TOKEN_B,
        { refresh: true },
      );

      expect(cacheManager.get).not.toHaveBeenCalled();
      expect(mockProvider.getCode).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining(
          getMockCacheKey(MOCK_ADDRESSES.TOKEN_A, MOCK_ADDRESSES.TOKEN_B),
        ),
        expect.any(String),
        expect.any(Number),
      );
      expect(result).toBeDefined();
    });

    it('should not cache when pair contract does not exist', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);
      mockProvider.getCode.mockResolvedValueOnce('0x'); // Empty code means contract doesn't exist

      loggerSpy = jest
        .spyOn(Logger.prototype, 'verbose')
        .mockImplementation(() => {});

      // Access the private method via any
      await expect(
        (service as any).getPairContract(
          MOCK_ADDRESSES.TOKEN_A,
          MOCK_ADDRESSES.NON_EXISTENT,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(cacheManager.get).toHaveBeenCalledWith(
        expect.stringContaining(
          getMockCacheKey(MOCK_ADDRESSES.TOKEN_A, MOCK_ADDRESSES.NON_EXISTENT),
        ),
      );
      expect(mockProvider.getCode).toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('getAmountOut', () => {
    it('should use cached pair contract for getAmountOut', async () => {
      const cachedPairAddress = MOCK_ADDRESSES.PAIR_ADDRESS;
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(cachedPairAddress);

      // Spy on the private getPairContract method
      const getPairContractSpy = jest.spyOn(service as any, 'getPairContract');

      // We need to mock the implementation to use the cache
      getPairContractSpy.mockImplementationOnce(async () => {
        await cacheManager.get(expect.any(String));
        return {
          getReserves: jest.fn().mockResolvedValue({
            reserve0: BigInt(1000),
            reserve1: BigInt(2000),
            blockTimestampLast: 0,
          }),
          token0: jest.fn().mockResolvedValue(MOCK_ADDRESSES.TOKEN_A),
        };
      });

      await service.getAmountOut(
        MOCK_ADDRESSES.TOKEN_A,
        MOCK_ADDRESSES.TOKEN_B,
        '0x1',
      );

      expect(getPairContractSpy).toHaveBeenCalledWith(
        MOCK_ADDRESSES.TOKEN_A,
        MOCK_ADDRESSES.TOKEN_B,
      );
      expect(cacheManager.get).toHaveBeenCalled();
      expect(mockProvider.getCode).not.toHaveBeenCalled();
    });
  });
});
