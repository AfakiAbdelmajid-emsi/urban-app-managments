import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'http://localhost:8001',
      timeout: 60_000,
    }),
  ],
  controllers: [AiController],
})
export class AiModule {}
