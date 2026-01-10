import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsGateway } from './alerts.gateway';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { CloudinaryService } from '../utils/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }]),
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsGateway, CloudinaryService],
  exports: [CloudinaryService],
})
export class AlertsModule {}
