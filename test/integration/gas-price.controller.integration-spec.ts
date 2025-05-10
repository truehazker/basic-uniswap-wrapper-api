import { Test, TestingModule } from '@nestjs/testing';
import { GasPriceController } from '@/modules/gas-price/gas-price.controller';
import { GasPriceService } from '@/modules/gas-price/gas-price.service';
import { InternalServerErrorException } from '@nestjs/common';
import { GasPriceResponseDto } from '@/modules/gas-price/dtos/gas-price.dto';
import { mockGasPriceResponse, validateGasPriceResponse } from '../utils/gas-price.test-utils';

describe('GasPriceController', () => {
  let gasPriceController: GasPriceController;
  let gasPriceService: jest.Mocked<GasPriceService>;

  beforeEach(async () => {
    const mockGasPriceService = {
      getGasPrice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GasPriceController],
      providers: [
        {
          provide: GasPriceService,
          useValue: mockGasPriceService,
        },
      ],
    }).compile();

    gasPriceController = module.get<GasPriceController>(GasPriceController);
    gasPriceService = module.get(GasPriceService);
  });

  describe('getGasPrice', () => {
    it('should return a valid gas price when service call succeeds', async () => {
      gasPriceService.getGasPrice.mockResolvedValue(mockGasPriceResponse);

      const result = await gasPriceController.getGasPrice();

      expect(gasPriceService.getGasPrice).toHaveBeenCalledTimes(1);
      validateGasPriceResponse(result);
    });

    it('should propagate service errors as InternalServerErrorException', async () => {
      const errorMessage = 'Failed to get gas price';
      gasPriceService.getGasPrice.mockRejectedValue(
        new InternalServerErrorException(errorMessage),
      );

      await expect(gasPriceController.getGasPrice()).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(gasPriceService.getGasPrice).toHaveBeenCalledTimes(1);
    });
  });
}); 