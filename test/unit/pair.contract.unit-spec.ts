import { PairContract } from '@/modules/uniswap/contracts/pair.contract';
import { ethers } from 'ethers';
import { MOCK_ADDRESSES, MOCK_RESERVES } from '../utils/uniswap.test-utils';

describe('PairContract', () => {
  let pairContract: PairContract;
  let mockContract: jest.Mocked<ethers.Contract>;
  let mockProvider: jest.Mocked<ethers.Provider>;

  beforeEach(async () => {
    // Create mock contract with required methods
    mockContract = {
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

    // Create mock provider
    mockProvider = {} as jest.Mocked<ethers.Provider>;

    // Mock ethers.Contract constructor
    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);

    pairContract = new PairContract(MOCK_ADDRESSES.PAIR_ADDRESS, mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a contract instance with correct address and ABI', () => {
      expect(ethers.Contract).toHaveBeenCalledWith(
        MOCK_ADDRESSES.PAIR_ADDRESS,
        expect.any(Array),
        mockProvider,
      );
    });
  });

  describe('getReserves', () => {
    it('should return reserves in correct format', async () => {
      const result = await pairContract.getReserves();

      expect(mockContract.getReserves).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        reserve0: MOCK_RESERVES.TOKEN_A_RESERVE,
        reserve1: MOCK_RESERVES.TOKEN_B_RESERVE,
        blockTimestampLast: MOCK_RESERVES.BLOCK_TIMESTAMP,
      });
    });

    it('should handle contract errors', async () => {
      const error = new Error('CALL_EXCEPTION');
      mockContract.getReserves.mockRejectedValueOnce(error);

      await expect(pairContract.getReserves()).rejects.toThrow(
        'CALL_EXCEPTION',
      );
    });
  });

  describe('token0', () => {
    it('should return token0 address', async () => {
      const result = await pairContract.token0();

      expect(mockContract.token0).toHaveBeenCalledTimes(1);
      expect(result).toBe(MOCK_ADDRESSES.TOKEN_A);
    });

    it('should handle contract errors', async () => {
      const error = new Error('CALL_EXCEPTION');
      mockContract.token0.mockRejectedValueOnce(error);

      await expect(pairContract.token0()).rejects.toThrow('CALL_EXCEPTION');
    });
  });

  describe('token1', () => {
    it('should return token1 address', async () => {
      const result = await pairContract.token1();

      expect(mockContract.token1).toHaveBeenCalledTimes(1);
      expect(result).toBe(MOCK_ADDRESSES.TOKEN_B);
    });

    it('should handle contract errors', async () => {
      const error = new Error('CALL_EXCEPTION');
      mockContract.token1.mockRejectedValueOnce(error);

      await expect(pairContract.token1()).rejects.toThrow('CALL_EXCEPTION');
    });
  });
});
