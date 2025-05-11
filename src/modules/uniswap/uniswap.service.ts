import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ethers, getAddress, keccak256, solidityPacked } from 'ethers';
import { ConfigService } from '../config/config.service';
import { THexString } from '@/types/common';
import { PairContract } from './contracts/pair.contract';

// Uniswap V2 INIT_CODE_HASH
const INIT_CODE_HASH =
  '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f';

@Injectable()
export class UniswapService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UniswapService.name);
  private provider: ethers.JsonRpcProvider;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get('RPC_URL'),
    );
  }

  async onModuleDestroy() {
    this.provider.destroy();
  }

  private calculatePairAddress(
    factory: string,
    tokenA: string,
    tokenB: string,
  ): string {
    // Sort tokens to match Uniswap's `token0` and `token1` pattern
    const [token0, token1] =
      tokenA.toLowerCase() < tokenB.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA];

    const salt = keccak256(
      solidityPacked(['address', 'address'], [token0, token1]),
    );

    const packed = solidityPacked(
      ['bytes1', 'address', 'bytes32', 'bytes32'],
      ['0xff', factory, salt, INIT_CODE_HASH],
    );

    const addressBytes = keccak256(packed);

    // Take the last 20 bytes
    const pairAddress = getAddress('0x' + addressBytes.slice(-40));

    return pairAddress;
  }

  private async getPairContract(
    tokenA: string,
    tokenB: string,
  ): Promise<PairContract> {
    const factoryAddress = this.configService.get('UNISWAP_FACTORY_ADDRESS');
    const pairAddress = this.calculatePairAddress(
      factoryAddress,
      tokenA,
      tokenB,
    );
    const code = await this.provider.getCode(pairAddress);

    // Check if the pair contract exists (costs 20 points)
    if (code === '0x') {
      throw new NotFoundException('Pair contract not found');
    }

    return new PairContract(pairAddress, this.provider);
  }

  async getAmountOut(
    fromTokenAddress: string,
    toTokenAddress: string,
    amountIn: string,
  ): Promise<THexString> {
    try {
      const pairContract = await this.getPairContract(
        fromTokenAddress,
        toTokenAddress,
      );

      // Get reserves and token0 in parallel
      const [reserves, token0] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
      ]);

      const amountInBN = BigInt(amountIn);
      const reserveIn =
        token0.toString().toLowerCase() === fromTokenAddress.toLowerCase()
          ? reserves.reserve0
          : reserves.reserve1;
      const reserveOut =
        token0.toString().toLowerCase() === fromTokenAddress.toLowerCase()
          ? reserves.reserve1
          : reserves.reserve0;

      // Uniswap V2 formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
      const amountOut = (amountInBN * reserveOut) / (reserveIn + amountInBN);

      return `0x${amountOut.toString(16)}`;
    } catch (error) {
      this.logger.error('Failed to calculate amount out:', error);
      throw error;
    }
  }
}
