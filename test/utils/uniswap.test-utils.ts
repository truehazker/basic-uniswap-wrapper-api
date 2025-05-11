import { NotFoundException } from '@nestjs/common';
import {
  AmountOutRequestDto,
  AmountOutResponseDto,
} from '@/modules/uniswap/dtos/amount-out.dto';
import { UniswapService } from '@modules/uniswap/uniswap.service';

// Mock Data
export const MOCK_ADDRESSES = {
  TOKEN_A: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  TOKEN_B: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  PAIR_ADDRESS: '0xd3d2E2692501A5c9Ca623199D38826e513033a17',
  NON_EXISTENT: '0x3333333333333333333333333333333333333333',
  INVALID: '0xinvalid',
} as const;

export const MOCK_RESERVES = {
  TOKEN_A_RESERVE: BigInt('1000000000000000000000'), // 1000 tokens
  TOKEN_B_RESERVE: BigInt('2000000000000000000000'), // 2000 tokens
  BLOCK_TIMESTAMP: 0,
} as const;

// Request/Response Mocks
export const mockValidParams: AmountOutRequestDto = {
  fromTokenAddress: MOCK_ADDRESSES.TOKEN_A,
  toTokenAddress: MOCK_ADDRESSES.TOKEN_B,
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
  getReserves: jest.fn().mockResolvedValue({
    reserve0: MOCK_RESERVES.TOKEN_A_RESERVE,
    reserve1: MOCK_RESERVES.TOKEN_B_RESERVE,
    blockTimestampLast: MOCK_RESERVES.BLOCK_TIMESTAMP,
  }),
  token0: jest.fn().mockResolvedValue(MOCK_ADDRESSES.TOKEN_A),
});

export const createMockGetPairContract = (service: UniswapService) => {
  return jest
    .spyOn(service as any, 'getPairContract')
    .mockImplementation(async (tokenA: string, tokenB: string) => {
      if (
        tokenA === MOCK_ADDRESSES.TOKEN_A &&
        tokenB === MOCK_ADDRESSES.TOKEN_B
      ) {
        return createMockPairContract();
      }
      throw new NotFoundException('Pair not found');
    });
};

export const calculateExpectedAmountOut = (amountIn: string): string => {
  // Convert hex string to decimal and parse with 18 decimals
  const amountInBN = BigInt(amountIn);
  const reserveIn = MOCK_RESERVES.TOKEN_A_RESERVE;
  const reserveOut = MOCK_RESERVES.TOKEN_B_RESERVE;

  // Uniswap V2 formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
  const amountOut = (amountInBN * reserveOut) / (reserveIn + amountInBN);

  return `0x${amountOut.toString(16)}`;
};
