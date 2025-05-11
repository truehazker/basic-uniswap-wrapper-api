import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyAdapter from '@/fastify-adapter';
import { GasPriceResponseDto } from '@/modules/gas-price/dtos/gas-price.dto';
import { GasPriceService } from '@/modules/gas-price/gas-price.service';
import { ServiceUnavailableException } from '@nestjs/common';
import {
  validateGasPriceResponse,
  mockGasPriceResponse,
} from '../utils/gas-price.test-utils';

describe('GasPrice (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleFixture: TestingModule;
  let gasPriceService: GasPriceService;

  beforeAll(async () => {
    const mockGasPriceService = {
      getGasPrice: jest.fn(),
    };

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GasPriceService)
      .useValue(mockGasPriceService)
      .compile();

    app =
      moduleFixture.createNestApplication<NestFastifyApplication>(
        fastifyAdapter,
      );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    gasPriceService = app.get<GasPriceService>(GasPriceService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /gasPrice', () => {
    it('should return a valid gas price response', async () => {
      jest
        .spyOn(gasPriceService, 'getGasPrice')
        .mockResolvedValueOnce(mockGasPriceResponse);

      const response = await app.inject({
        method: 'GET',
        url: '/gasPrice',
      });

      expect(response.statusCode).toEqual(200);
      const body = JSON.parse(response.payload) as GasPriceResponseDto;
      validateGasPriceResponse(body);
    });

    it('should respond within 50ms', async () => {
      jest
        .spyOn(gasPriceService, 'getGasPrice')
        .mockResolvedValueOnce(mockGasPriceResponse);

      const startTime = Date.now();

      const response = await app.inject({
        method: 'GET',
        url: '/gasPrice',
      });

      const responseTime = Date.now() - startTime;

      expect(response.statusCode).toEqual(200);
      expect(responseTime).toBeLessThan(50);
    });

    it('should handle RPC node unavailability with 503 status', async () => {
      const errorMessage = 'RPC node is currently unavailable';
      jest
        .spyOn(gasPriceService, 'getGasPrice')
        .mockRejectedValueOnce(new ServiceUnavailableException(errorMessage));

      const response = await app.inject({
        method: 'GET',
        url: '/gasPrice',
      });

      expect(response.statusCode).toEqual(503);
      const body = JSON.parse(response.payload);
      expect(body.message).toBe(errorMessage);
    });
  });
});
