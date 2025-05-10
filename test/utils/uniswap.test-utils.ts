import { ethers } from 'ethers';
import { NotFoundException, Logger, BadRequestException, InternalServerErrorException, ValidationPipe } from '@nestjs/common';
import { AmountOutRequestDto, AmountOutResponseDto } from '@/modules/uniswap/dtos/amount-out.dto';

// Mock Data
export const MOCK_TOKENS = {
  TOKEN_A: '0x1111111111111111111111111111111111111111',
  TOKEN_B: '0x2222222222222222222222222222222222222222',
  NON_EXISTENT: '0x3333333333333333333333333333333333333333',
  INVALID: '0xinvalid',
} as const;

export const MOCK_CONFIG = {
  RPC_URL: 'https://mock-rpc-url',
  UNISWAP_FACTORY_ADDRESS: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
} as const;

export const MOCK_RESERVES = {
  TOKEN_A_RESERVE: BigInt('1000000000000000000000'), // 1000 tokens
  TOKEN_B_RESERVE: BigInt('2000000000000000000000'), // 2000 tokens
  BLOCK_TIMESTAMP: 0,
} as const;

// Request/Response Mocks
export const mockValidParams: AmountOutRequestDto = {
  fromTokenAddress: MOCK_TOKENS.TOKEN_A,
  toTokenAddress: MOCK_TOKENS.TOKEN_B,
  amountIn: '0x1', // Keep as hex string to match DTO type
};

export const mockAmountOutResponse: AmountOutResponseDto = {
  amountOut: '0x1', // Simple test value
};

// Validation Helpers
export const validateAmountOutResponse = (response: AmountOutResponseDto) => {
  expect(response).toBeDefined();
  expect(response.amountOut).toBeDefined();
  expect(response.amountOut).toMatch(/^0x[a-fA-F0-9]+$/);
};

// Unit Test Helpers
export const createMockPairContract = () => ({
  getReserves: jest.fn().mockResolvedValue([
    MOCK_RESERVES.TOKEN_A_RESERVE,
    MOCK_RESERVES.TOKEN_B_RESERVE,
    MOCK_RESERVES.BLOCK_TIMESTAMP,
  ]),
  token0: jest.fn().mockResolvedValue(MOCK_TOKENS.TOKEN_A),
});

export const createMockGetPairContract = (service: any) => {
  return jest.spyOn(service, 'getPairContract').mockImplementation(async (tokenA: string, tokenB: string) => {
    if (tokenA === MOCK_TOKENS.TOKEN_A && tokenB === MOCK_TOKENS.TOKEN_B) {
      return createMockPairContract();
    }
    throw new NotFoundException('Pair not found');
  });
};

export const mockLogger = () => {
  return jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
};

export const calculateExpectedAmountOut = (amountIn: string): string => {
  // Convert hex string to decimal and parse with 18 decimals
  const amountInBN = ethers.parseUnits(amountIn, 18);
  const reserveIn = MOCK_RESERVES.TOKEN_A_RESERVE;
  const reserveOut = MOCK_RESERVES.TOKEN_B_RESERVE;

  // Uniswap V2 formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
  const amountOut = (amountInBN * reserveOut) / (reserveIn + amountInBN);
  
  return `0x${amountOut.toString(16)}`;
};

// Integration Test Helpers
export const createMockUniswapService = () => ({
  getAmountOut: jest.fn(),
});

export const createValidationPipe = () => {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
};

// E2E Test Helpers
export const createMockApp = async (moduleFixture: any) => {
  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return app;
};

// Common Test Setup
export const setupUniswapTest = async (service: any) => {
  createMockGetPairContract(service);
  return {
    mockGetPairContract: createMockGetPairContract(service),
    mockLogger: mockLogger(),
  };
};
