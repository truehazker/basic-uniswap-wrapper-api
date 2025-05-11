import { AddressLike, ethers } from 'ethers';

export interface IGetReserves {
  reserve0: bigint;
  reserve1: bigint;
  blockTimestampLast: bigint;
}

// Uniswap V2 Pair ABI
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

export class PairContract {
  private contract: ethers.Contract;

  constructor(
    private readonly pairAddress: string,
    private readonly provider: ethers.Provider,
  ) {
    this.contract = new ethers.Contract(
      this.pairAddress,
      PAIR_ABI,
      this.provider,
    );
  }

  async getReserves(): Promise<IGetReserves> {
    const [reserve0, reserve1, blockTimestampLast] =
      await this.contract.getReserves();

    return {
      reserve0: BigInt(reserve0),
      reserve1: BigInt(reserve1),
      blockTimestampLast: BigInt(blockTimestampLast),
    };
  }

  async token0(): Promise<AddressLike> {
    return this.contract.token0();
  }

  async token1(): Promise<AddressLike> {
    return this.contract.token1();
  }
}
