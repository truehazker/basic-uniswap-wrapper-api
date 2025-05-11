import { THexString } from '@/types/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal } from 'class-validator';

export class GasPriceResponseDto {
  @ApiProperty({
    description: 'The gas price in wei',
    example: '0x1',
  })
  @IsHexadecimal()
  gasPrice: THexString;
}
