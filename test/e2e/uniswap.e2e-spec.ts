import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyAdapter from '@/fastify-adapter';
import { AmountOutResponseDto } from '@/modules/uniswap/dtos/amount-out.dto';
import { UniswapService } from '@/modules/uniswap/uniswap.service';
import { BadRequestException, InternalServerErrorException, NotFoundException, ValidationPipe } from '@nestjs/common';
import { validateAmountOutResponse, mockValidParams, mockAmountOutResponse } from '../utils/uniswap.test-utils';

describe('Uniswap (e2e)', () => {
  let app: NestFastifyApplication;
  let moduleFixture: TestingModule;
  let uniswapService: UniswapService;

  beforeAll(async () => {
    const mockUniswapService = {
      getAmountOut: jest.fn(),
    };

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(UniswapService)
    .useValue(mockUniswapService)
    .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      fastifyAdapter,
    );

    // Enable validation
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    
    uniswapService = app.get<UniswapService>(UniswapService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /return/:fromTokenAddress/:toTokenAddress/:amountIn', () => {
    it('should return a valid amount out response', async () => {
      jest.spyOn(uniswapService, 'getAmountOut').mockResolvedValueOnce(mockAmountOutResponse.amountOut);

      const response = await app.inject({
        method: 'GET',
        url: `/return/${mockValidParams.fromTokenAddress}/${mockValidParams.toTokenAddress}/${mockValidParams.amountIn}`,
      });

      expect(response.statusCode).toEqual(200);
      const body = JSON.parse(response.payload) as AmountOutResponseDto;
      validateAmountOutResponse(body);
    });

    it('should respond within 100ms', async () => {
      jest.spyOn(uniswapService, 'getAmountOut').mockResolvedValueOnce(mockAmountOutResponse.amountOut);
      
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: `/return/${mockValidParams.fromTokenAddress}/${mockValidParams.toTokenAddress}/${mockValidParams.amountIn}`,
      });

      const responseTime = Date.now() - startTime;
      
      expect(response.statusCode).toEqual(200);
      expect(responseTime).toBeLessThan(100);
    });

    it('should handle invalid token addresses with 400 status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/return/0xinvalid/${mockValidParams.toTokenAddress}/${mockValidParams.amountIn}`,
      });

      expect(response.statusCode).toEqual(400);
      const body = JSON.parse(response.payload);
      expect(body.message).toEqual(['fromTokenAddress must be an Ethereum address']);
    });

    it('should handle invalid amount in with 400 status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/return/${mockValidParams.fromTokenAddress}/${mockValidParams.toTokenAddress}/0xinvalid`,
      });

      expect(response.statusCode).toEqual(400);
      const body = JSON.parse(response.payload);
      expect(body.message).toEqual(['amountIn must be a hexadecimal number']);
    });

    it('should handle service errors with 404 status', async () => {
      const errorMessage = 'Failed to calculate amount out';
      jest.spyOn(uniswapService, 'getAmountOut').mockRejectedValueOnce(
        new NotFoundException(errorMessage),
      );

      const response = await app.inject({
        method: 'GET',
        url: `/return/${mockValidParams.fromTokenAddress}/${mockValidParams.toTokenAddress}/${mockValidParams.amountIn}`,
      });

      expect(response.statusCode).toEqual(404);
      const body = JSON.parse(response.payload);
      expect(body.message).toBe(errorMessage);
    });
  });
}); 