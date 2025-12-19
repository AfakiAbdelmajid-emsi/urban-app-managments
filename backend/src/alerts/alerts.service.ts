import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument } from './schemas/alert.schema';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AlertsGateway } from './alerts.gateway';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
    private readonly alertsGateway: AlertsGateway,
  ) {}

  // 🔴 CREATE
  async createAlert(userId: string, dto: CreateAlertDto) {
    const alert = await new this.alertModel({
      ...dto,
      userId,
      confirmations: 0,
      denials: 0,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }).save();

    this.alertsGateway.emitAlertCreated(alert);
    return alert;
  }

  // 🔍 GET ALL
  async getAllAlerts() {
    return this.alertModel.find().sort({ createdAt: -1 }).exec();
  }

  // 🔍 GET ONE
  async getAlertById(id: string) {
    const alert = await this.alertModel.findById(id);
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  // 👍 CONFIRM
  async confirmAlert(id: string) {
    const alert = await this.alertModel.findByIdAndUpdate(
      id,
      { $inc: { confirmations: 1 } },
      { new: true },
    );

    if (!alert) throw new NotFoundException('Alert not found');

    this.alertsGateway.emitAlertConfirmed(alert);
    return alert;
  }

  // 👎 DENY
  async denyAlert(id: string) {
    const alert = await this.alertModel.findByIdAndUpdate(
      id,
      { $inc: { denials: 1 } },
      { new: true },
    );

    if (!alert) throw new NotFoundException('Alert not found');

    this.alertsGateway.emitAlertDenied(alert);
    return alert;
  }

  // 🗑️ DELETE
  async deleteAlert(id: string) {
    const alert = await this.alertModel.findByIdAndDelete(id);
    if (!alert) throw new NotFoundException('Alert not found');

    this.alertsGateway.emitAlertDeleted(alert._id);
    return { message: 'Alert deleted' };
  }
}
