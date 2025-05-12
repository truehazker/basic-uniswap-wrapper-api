import { Test, TestingModule } from '@nestjs/testing';
import { UniswapService } from '@/modules/uniswap/uniswap.service';
import { ConfigService } from '@/modules/config/config.service';
import { Logger, NotFoundException } from '@nestjs/common';
import {
  MOCK_ADDRESSES,
  calculateExpectedAmountOut,
  createMockGetPairContract,
} from '../utils/uniswap.test-utils';
import { ConfigModule } from '@modules/config/config.module';
import { CacheModule } from '@nestjs/cache-manager';

describe('UniswapService', () => {
  let service: UniswapService;
  let mockGetPairContract: jest.SpyInstance;
  let loggerSpy: jest.SpyInstance;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, CacheModule.register()],
      providers: [UniswapService],
    }).compile();

    service = module.get<UniswapService>(UniswapService);
    configService = module.get<ConfigService>(ConfigService);
    mockGetPairContract = createMockGetPairContract(service);
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (loggerSpy) {
      loggerSpy.mockRestore();
    }
  });

  describe('calculatePairAddress', () => {
    it('should calculate correct pair address for sorted tokens', () => {
      const pairAddress = (service as any).calculatePairAddress(
        configService.get('UNISWAP_FACTORY_ADDRESS'),
        MOCK_ADDRESSES.TOKEN_A,
        MOCK_ADDRESSES.TOKEN_B,
      );

      expect(pairAddress).toBeDefined();
      expect(pairAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(pairAddress).toBe(MOCK_ADDRESSES.PAIR_ADDRESS);
    });

    it('should handle unsorted tokens correctly', () => {
      // Cast to 'any' to be able to access private method
      const pairAddress1 = (service as any).calculatePairAddress(
        configService.get('UNISWAP_FACTORY_ADDRESS'),
        MOCK_ADDRESSES.TOKEN_B,
        MOCK_ADDRESSES.TOKEN_A,
      );
      const pairAddress2 = (service as any).calculatePairAddress(
        configService.get('UNISWAP_FACTORY_ADDRESS'),
        MOCK_ADDRESSES.TOKEN_A,
        MOCK_ADDRESSES.TOKEN_B,
      );

      expect(pairAddress1).toBe(pairAddress2);
    });
  });

  describe('getAmountOut', () => {
    const mockParams = {
      fromTokenAddress: MOCK_ADDRESSES.TOKEN_A,
      toTokenAddress: MOCK_ADDRESSES.TOKEN_B,
      amountIn: '0x1',
    };

    it('should calculate amount out correctly', async () => {
      const amountOut = await service.getAmountOut(
        mockParams.fromTokenAddress,
        mockParams.toTokenAddress,
        mockParams.amountIn,
      );

      const expectedAmountOut = calculateExpectedAmountOut(mockParams.amountIn);
      expect(amountOut).toBe(expectedAmountOut);
    });

    it('should throw NotFoundException when pair does not exist', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      await expect(
        service.getAmountOut(
          MOCK_ADDRESSES.NON_EXISTENT,
          mockParams.toTokenAddress,
          mockParams.amountIn,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle errors and rethrow them', async () => {
      loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      mockGetPairContract.mockRejectedValueOnce(new Error('RPC error'));

      await expect(
        service.getAmountOut(
          mockParams.fromTokenAddress,
          mockParams.toTokenAddress,
          mockParams.amountIn,
        ),
      ).rejects.toThrow('RPC error');
    });
  });
});
