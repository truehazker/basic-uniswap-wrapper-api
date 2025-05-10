import { Test, TestingModule } from '@nestjs/testing';
import { UniswapService } from '@/modules/uniswap/uniswap.service';
import { ConfigService } from '@/modules/config/config.service';
import { NotFoundException } from '@nestjs/common';
import {
  MOCK_CONFIG,
  MOCK_TOKENS,
  setupUniswapTest,
  calculateExpectedAmountOut,
} from '../utils/uniswap.test-utils';

describe('UniswapService', () => {
  let service: UniswapService;
  let mockGetPairContract: jest.SpyInstance;
  let mockLogger: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniswapService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof typeof MOCK_CONFIG) => MOCK_CONFIG[key]),
          },
        },
      ],
    }).compile();

    service = module.get<UniswapService>(UniswapService);
    const mocks = await setupUniswapTest(service);
    mockGetPairContract = mocks.mockGetPairContract;
    mockLogger = mocks.mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (mockLogger) {
      mockLogger.mockRestore();
    }
  });

  describe('calculatePairAddress', () => {
    it('should calculate correct pair address for sorted tokens', () => {
      const pairAddress = (service as any).calculatePairAddress(
        MOCK_CONFIG.UNISWAP_FACTORY_ADDRESS,
        MOCK_TOKENS.TOKEN_A,
        MOCK_TOKENS.TOKEN_B
      );
      
      expect(pairAddress).toBeDefined();
      expect(pairAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should handle unsorted tokens correctly', () => {
      const pairAddress1 = (service as any).calculatePairAddress(
        MOCK_CONFIG.UNISWAP_FACTORY_ADDRESS,
        MOCK_TOKENS.TOKEN_B,
        MOCK_TOKENS.TOKEN_A
      );
      const pairAddress2 = (service as any).calculatePairAddress(
        MOCK_CONFIG.UNISWAP_FACTORY_ADDRESS,
        MOCK_TOKENS.TOKEN_A,
        MOCK_TOKENS.TOKEN_B
      );
      
      expect(pairAddress1).toBe(pairAddress2);
    });
  });

  describe('getAmountOut', () => {
    const mockParams = {
      fromTokenAddress: MOCK_TOKENS.TOKEN_A,
      toTokenAddress: MOCK_TOKENS.TOKEN_B,
      amountIn: '1',
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
      await expect(service.getAmountOut(
        MOCK_TOKENS.NON_EXISTENT,
        mockParams.toTokenAddress,
        mockParams.amountIn,
      )).rejects.toThrow(NotFoundException);
    });

    it('should handle errors and rethrow them', async () => {
      mockGetPairContract.mockRejectedValueOnce(new Error('RPC error'));

      await expect(service.getAmountOut(
        mockParams.fromTokenAddress,
        mockParams.toTokenAddress,
        mockParams.amountIn,
      )).rejects.toThrow('RPC error');
    });
  });
}); 