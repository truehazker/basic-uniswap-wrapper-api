import { Controller, Get, Param } from '@nestjs/common';
import { UniswapService } from './uniswap.service';
import {
  AmountOutRequestDto,
  AmountOutResponseDto,
} from './dtos/amount-out.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller()
export class UniswapController {
  constructor(private readonly uniswapService: UniswapService) {}

  @Get('return/:fromTokenAddress/:toTokenAddress/:amountIn')
  @ApiOperation({ summary: 'Get amount out for a swap' })
  @ApiParam({
    name: 'fromTokenAddress',
    description: 'The address of the token being swapped from',
  })
  @ApiParam({
    name: 'toTokenAddress',
    description: 'The address of the token being swapped to',
  })
  @ApiParam({
    name: 'amountIn',
    description: 'The amount of tokens being swapped',
  })
  @ApiResponse({
    status: 200,
    description: 'The amount of tokens out in wei',
    type: AmountOutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token addresses or amount in',
  })
  @ApiResponse({ status: 404, description: 'Pair contract not found' })
  async getAmountOut(
    @Param()
    { fromTokenAddress, toTokenAddress, amountIn }: AmountOutRequestDto,
  ): Promise<AmountOutResponseDto> {
    const amountOut = await this.uniswapService.getAmountOut(
      fromTokenAddress,
      toTokenAddress,
      amountIn,
    );

    return { amountOut };
  }
}
