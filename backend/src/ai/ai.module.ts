import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://peaceful-happiness-production-959b.up.railway.app',
      timeout: 60_000,
    }),
  ],
  controllers: [AiController],
})
export class AiModule {}
