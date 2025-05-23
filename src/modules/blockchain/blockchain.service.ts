import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '../config/config.service';

export interface IBlockchainProvider {
  getCode(address: string): Promise<string>;
  getFeeData(): Promise<{ gasPrice: bigint | null }>;
  createContract(address: string, abi: any[]): any;
  getProvider(): any;
}

@Injectable()
export class BlockchainService implements IBlockchainProvider, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get('RPC_URL'),
    );
  }

  async onModuleDestroy() {
    this.provider.destroy();
  }

  async getCode(address: string): Promise<string> {
    return this.provider.getCode(address);
  }

  async getFeeData(): Promise<{ gasPrice: bigint | null }> {
    const feeData = await this.provider.getFeeData();
    return { gasPrice: feeData.gasPrice };
  }

  createContract(address: string, abi: any[]): ethers.Contract {
    return new ethers.Contract(address, abi, this.provider);
  }

  getProvider(): ethers.JsonRpcProvider {
    // Only for legacy support - should be avoided in new code
    return this.provider;
  }
}
