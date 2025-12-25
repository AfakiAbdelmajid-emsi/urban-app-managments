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
    const alerts = await this.alertModel.find().sort({ createdAt: -1 }).exec();
    console.log(`Alerts FILTERED and retrieved: ${alerts.length} alerts found`);
    return alerts;
  }

  // 🔍 GET ALERTS BY USER ID
  async getAlertsByUserId(userId: string) {
    const alerts = await this.alertModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    console.log(`Alerts FILTERED for user ${userId}: ${alerts.length} alerts found`);
    return alerts;
  }

  // 🔍 GET ALL FILTERED BY KILOMETERS
  async getAllAlertsFilteredByKilometers(
    latitude: number,
    longitude: number,
    distanceKm: number,
  ) {
    const allAlerts = await this.alertModel.find().sort({ createdAt: -1 }).exec();
    
    const filteredAlerts = allAlerts.filter((alert) => {
      const distance = this.calculateDistanceInKilometers(
        latitude,
        longitude,
        alert.latitude,
        alert.longitude,
      );
      return distance <= distanceKm;
    });

    console.log(
      `Alerts FILTERED by ${distanceKm} kilometers from (${latitude}, ${longitude}): ${filteredAlerts.length} alerts found out of ${allAlerts.length} total`,
    );
    return filteredAlerts;
  }

  // Calculate distance in kilometers using Haversine formula
  private calculateDistanceInKilometers(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
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
