import { Controller, Get } from '@nestjs/common';
import { GasPriceService } from './gas-price.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GasPriceResponseDto } from './dtos/gas-price.dto';

@Controller('gasPrice')
export class GasPriceController {
  constructor(private readonly gasPriceService: GasPriceService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current gas price in wei' })
  @ApiResponse({
    status: 200,
    description: 'The current gas price in wei',
    type: GasPriceResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'RPC node is currently unavailable',
  })
  async getGasPrice(): Promise<GasPriceResponseDto> {
    return this.gasPriceService.getGasPrice();
  }
}
