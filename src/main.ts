import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import {
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyAdapter from '@/fastify-adapter';
import { ConfigService } from '@/modules/config/config.service';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  const configService = app.get(ConfigService);
  const port = configService.get('SERVER_PORT');
  const host = configService.get('SERVER_HOST');

  await app.listen(port, host);
}
bootstrap();
