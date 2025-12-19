import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AlertsModule } from './alerts/alerts.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),

    MongooseModule.forRoot(process.env.MONGODB_URI as string),

    AuthModule,
    UsersModule,
    AlertsModule,
    AiModule,
  ],
})
export class AppModule {}
