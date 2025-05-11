import { PairContract } from '@/modules/uniswap/contracts/pair.contract';
import { ethers } from 'ethers';

describe('PairContract', () => {
  let pairContract: PairContract;
  let mockContract: jest.Mocked<ethers.Contract>;
  let mockProvider: jest.Mocked<ethers.Provider>;

  const mockPairAddress = '0x3333333333333333333333333333333333333333';
  const mockReserves = {
    reserve0: BigInt('1000000'),
    reserve1: BigInt('2000000'),
    blockTimestampLast: BigInt('0'),
  };
  const mockToken0 = '0x1111111111111111111111111111111111111111';
  const mockToken1 = '0x2222222222222222222222222222222222222222';

  beforeEach(async () => {
    // Create mock contract with required methods
    mockContract = {
      getReserves: jest
        .fn()
        .mockResolvedValue([
          mockReserves.reserve0,
          mockReserves.reserve1,
          mockReserves.blockTimestampLast,
        ]),
      token0: jest.fn().mockResolvedValue(mockToken0),
      token1: jest.fn().mockResolvedValue(mockToken1),
    } as unknown as jest.Mocked<ethers.Contract>;

    // Create mock provider
    mockProvider = {} as jest.Mocked<ethers.Provider>;

    // Mock ethers.Contract constructor
    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);

    pairContract = new PairContract(mockPairAddress, mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a contract instance with correct address and ABI', () => {
      expect(ethers.Contract).toHaveBeenCalledWith(
        mockPairAddress,
        expect.any(Array),
        mockProvider,
      );
    });
  });

  describe('getReserves', () => {
    it('should return reserves in correct format', async () => {
      const result = await pairContract.getReserves();

      expect(mockContract.getReserves).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockReserves);
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
      expect(result).toBe(mockToken0);
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
      expect(result).toBe(mockToken1);
    });

    it('should handle contract errors', async () => {
      const error = new Error('CALL_EXCEPTION');
      mockContract.token1.mockRejectedValueOnce(error);

      await expect(pairContract.token1()).rejects.toThrow('CALL_EXCEPTION');
    });
  });
});
