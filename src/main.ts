import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyAdapter from '@/fastify-adapter';
import { ConfigService } from '@/modules/config/config.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    {
      bufferLogs: true,
    },
  );

  const configService = app.get(ConfigService);

  Logger.overrideLogger(configService.get('LOG_LEVEL'));
  const logger = new Logger('Bootstrap');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const env = configService.get('NODE_ENV');

  // Swagger setup for development
  if (env === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Basic Uniswap Wrapper API')
      .setDescription('The basic uniswap wrapper API documentation')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);

    logger.log('Swagger initialized');
  }

  const port = configService.get('SERVER_PORT');
  const host = configService.get('SERVER_HOST');
  await app.listen(port, host);
}
bootstrap();
