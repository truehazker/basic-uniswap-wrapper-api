import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { getAddress, keccak256, solidityPacked } from 'ethers';
import { ConfigService } from '../config/config.service';
import { THexString } from '@/types/common';
import { PairContract } from './contracts/pair.contract';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CacheService } from '../cache/cache.service';

// Uniswap V2 INIT_CODE_HASH
const INIT_CODE_HASH =
  '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f';

export interface IPairContractOptions {
  refresh?: boolean;
}

@Injectable()
export class UniswapService {
  private readonly logger = new Logger(UniswapService.name);

  constructor(
    private configService: ConfigService,
    private blockchainService: BlockchainService,
    private cacheService: CacheService,
  ) {}

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
    options: IPairContractOptions = {},
  ): Promise<PairContract> {
    const { refresh = false } = options;

    // Sort tokens for consistent cache key
    const [token0, token1] =
      tokenA.toLowerCase() < tokenB.toLowerCase()
        ? [tokenA.toLowerCase(), tokenB.toLowerCase()]
        : [tokenB.toLowerCase(), tokenA.toLowerCase()];
    const cacheKey = `uniswap:pair:${token0}_${token1}`;

    // Check cache first (unless refresh is true)
    if (!refresh) {
      const cachedAddress = await this.cacheService.get<string>(cacheKey);
      if (cachedAddress) {
        this.logger.verbose(`Using cached pair: ${cachedAddress}`);
        return new PairContract(
          cachedAddress,
          this.blockchainService.getProvider(),
        );
      }
    }

    const factoryAddress = this.configService.get('UNISWAP_FACTORY_ADDRESS');
    const pairAddress = this.calculatePairAddress(
      factoryAddress,
      tokenA,
      tokenB,
    );
    const code = await this.blockchainService.getCode(pairAddress);

    // Check if the pair contract exists
    if (code === '0x') {
      throw new NotFoundException('Pair contract not found');
    }

    // Cache the pair address
    await this.cacheService.set(
      cacheKey,
      pairAddress,
      this.configService.get('PAIR_CACHE_TTL'),
    );
    this.logger.verbose(`Cached pair: ${pairAddress}`);

    return new PairContract(pairAddress, this.blockchainService.getProvider());
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

      // Uniswap V2 formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
      // The 997/1000 factor accounts for the 0.3% trading fee
      const amountInWithFee = amountInBN * BigInt(997);
      const numerator = amountInWithFee * reserveOut;
      const denominator = reserveIn * BigInt(1000) + amountInWithFee;
      const amountOut = numerator / denominator;

      return `0x${amountOut.toString(16)}`;
    } catch (error) {
      this.logger.error('Failed to calculate amount out:', error);
      throw error;
    }
  }
}
