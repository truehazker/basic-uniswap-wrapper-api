import { THexString } from "@/types/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEthereumAddress, IsHexadecimal } from "class-validator";

export class AmountOutRequestDto {
  @ApiProperty({
    description: 'The address of the token being swapped from',
    example: '0x1',
  })
  @IsString()
  @IsNotEmpty()
  @IsEthereumAddress()
  fromTokenAddress: string;

  @ApiProperty({
    description: 'The address of the token being swapped to',
    example: '0x1',
  })
  @IsString()
  @IsNotEmpty()
  @IsEthereumAddress()
  toTokenAddress: string;

  @ApiProperty({
    description: 'The amount of tokens being swapped',
    example: '1000000000000000000',
  })
  @IsString()
  @IsNotEmpty()
  @IsHexadecimal()
  amountIn: THexString;
}

export class AmountOutResponseDto {
  @ApiProperty({
    description: 'The amount of tokens out in wei',
    example: '0x1',
  })
  amountOut: THexString;
}
