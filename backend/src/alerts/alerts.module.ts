import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsGateway } from './alerts.gateway';
import { Alert, AlertSchema } from './schemas/alert.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }]),
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsGateway],
})
export class AlertsModule {}
