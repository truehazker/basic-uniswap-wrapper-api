import { Test, TestingModule } from '@nestjs/testing';
import { UniswapController } from '@/modules/uniswap/uniswap.controller';
import { UniswapService } from '@/modules/uniswap/uniswap.service';
import { InternalServerErrorException, BadRequestException, ValidationPipe } from '@nestjs/common';
import { AmountOutResponseDto, AmountOutRequestDto } from '@/modules/uniswap/dtos/amount-out.dto';
import { mockAmountOutResponse, mockValidParams, validateAmountOutResponse } from '../utils/uniswap.test-utils';

describe('UniswapController', () => {
  let uniswapController: UniswapController;
  let uniswapService: jest.Mocked<UniswapService>;
  let validationPipe: ValidationPipe;

  beforeEach(async () => {
    const mockUniswapService = {
      getAmountOut: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UniswapController],
      providers: [
        {
          provide: UniswapService,
          useValue: mockUniswapService,
        },
      ],
    }).compile();

    uniswapController = module.get<UniswapController>(UniswapController);
    uniswapService = module.get(UniswapService);
    validationPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  });

  describe('getAmountOut', () => {
    it('should return a valid amount out when service call succeeds', async () => {
      uniswapService.getAmountOut.mockResolvedValue(mockAmountOutResponse.amountOut);

      const validatedParams = await validationPipe.transform(mockValidParams, {
        type: 'param',
        metatype: AmountOutRequestDto,
      });
      const result = await uniswapController.getAmountOut(validatedParams);

      expect(uniswapService.getAmountOut).toHaveBeenCalledTimes(1);
      expect(uniswapService.getAmountOut).toHaveBeenCalledWith(
        mockValidParams.fromTokenAddress,
        mockValidParams.toTokenAddress,
        mockValidParams.amountIn,
      );
      validateAmountOutResponse(result);
    });

    it('should propagate service errors as InternalServerErrorException', async () => {
      const errorMessage = 'Failed to calculate amount out';
      uniswapService.getAmountOut.mockRejectedValue(
        new InternalServerErrorException(errorMessage),
      );

      const validatedParams = await validationPipe.transform(mockValidParams, {
        type: 'param',
        metatype: AmountOutRequestDto,
      });
      await expect(uniswapController.getAmountOut(validatedParams)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(uniswapService.getAmountOut).toHaveBeenCalledTimes(1);
      expect(uniswapService.getAmountOut).toHaveBeenCalledWith(
        mockValidParams.fromTokenAddress,
        mockValidParams.toTokenAddress,
        mockValidParams.amountIn,
      );
    });

    it('should handle invalid token addresses', async () => {
      const invalidParams: AmountOutRequestDto = {
        ...mockValidParams,
        fromTokenAddress: '0xinvalid',
      };

      await expect(validationPipe.transform(invalidParams, {
        type: 'param',
        metatype: AmountOutRequestDto,
      })).rejects.toThrow(BadRequestException);
      expect(uniswapService.getAmountOut).not.toHaveBeenCalled();
    });

    it('should handle invalid amount in', async () => {
      const invalidParams: AmountOutRequestDto = {
        ...mockValidParams,
        amountIn: '0xinvalid',
      };

      await expect(validationPipe.transform(invalidParams, {
        type: 'param',
        metatype: AmountOutRequestDto,
      })).rejects.toThrow(BadRequestException);
      expect(uniswapService.getAmountOut).not.toHaveBeenCalled();
    });
  });
}); 