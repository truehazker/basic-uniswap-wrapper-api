import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from '@/modules/config/config.service';

@Module({
  imports: [
    // NOTE: NestConfigModule initializes itself with the same name as our custom ConfigModule
    //       and it's not possible to change it. So we have two 'ConfigModule dependencies initialized' messages
    //       in the logs.
    NestConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV 
        ? ['.env', `.env.${process.env.NODE_ENV}`] // Will work even if env-specific file is missing
        : '.env',
      validate: ConfigService.validateConfig,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true // Stop validation after first error
      }
    })
  ],
  controllers: [],
  providers: [ConfigService],
  exports: [ConfigService]
})
export class ConfigModule {}
