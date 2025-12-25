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

  // 🔴 CREATE - Crash-proof with validation
  async createAlert(userId: string, dto: CreateAlertDto) {
    try {
      // Validate userId
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId');
      }

      // Validate coordinates
      if (!this.isValidCoordinate(dto.latitude, dto.longitude)) {
        throw new Error('Invalid coordinates');
      }

      const alert = await new this.alertModel({
        ...dto,
        userId,
        confirmations: 0,
        denials: 0,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      }).save();

      // Emit event safely (won't crash if gateway fails)
      this.alertsGateway.emitAlertCreated(alert).catch((error) => {
        console.error('❌ [CREATE] Error emitting alert_created event:', error);
        // Continue even if emit fails
      });

      console.log(`✅ [CREATE] Alert created: ${alert._id}`);
      return alert;
    } catch (error) {
      console.error('❌ [CREATE] Error creating alert:', error);
      throw error; // Re-throw for controller to handle
    }
  }

  // 🔍 GET ALL - Crash-proof with error handling and .lean()
  async getAllAlerts() {
    try {
      const alerts = await this.alertModel
        .find()
        .lean()
        .sort({ createdAt: -1 })
        .exec();
      
      const safeAlerts = this.sanitizeAlerts(alerts as any[]);
      console.log(`✅ [GET ALL] Retrieved ${safeAlerts.length} alerts`);
      return safeAlerts;
    } catch (error) {
      console.error('❌ [GET ALL] Error fetching alerts:', error);
      // Return empty array instead of crashing
      return [];
    }
  }

  // 🔍 GET ALERTS BY USER ID - Crash-proof
  async getAlertsByUserId(userId: string) {
    try {
      if (!userId || typeof userId !== 'string') {
        console.warn('⚠️ [GET BY USER] Invalid userId:', userId);
        return [];
      }

      const alerts = await this.alertModel
        .find({ userId })
        .lean()
        .sort({ createdAt: -1 })
        .exec();
      
      const safeAlerts = this.sanitizeAlerts(alerts as any[]);
      console.log(`✅ [GET BY USER] Retrieved ${safeAlerts.length} alerts for user ${userId}`);
      return safeAlerts;
    } catch (error) {
      console.error(`❌ [GET BY USER] Error fetching alerts for user ${userId}:`, error);
      return [];
    }
  }

  // 🔍 GET ALL FILTERED BY KILOMETERS - Crash-proof with validation
  async getAllAlertsFilteredByKilometers(
    latitude: number,
    longitude: number,
    distanceKm: number,
  ) {
    try {
      // Validate coordinates before processing
      if (!this.isValidCoordinate(latitude, longitude)) {
        console.warn(`⚠️ [FILTER BY KM] Invalid coordinates: lat=${latitude}, lon=${longitude}`);
        return [];
      }

      // Validate distance
      if (typeof distanceKm !== 'number' || distanceKm <= 0 || distanceKm > 1000) {
        console.warn(`⚠️ [FILTER BY KM] Invalid distance: ${distanceKm}`);
        return [];
      }

      const allAlerts = await this.alertModel
        .find()
        .lean()
        .sort({ createdAt: -1 })
        .exec();
      
      const filteredAlerts = allAlerts.filter((alert: any) => {
        try {
          // Validate alert coordinates
          if (!this.isValidCoordinate(alert.latitude, alert.longitude)) {
            console.warn(`⚠️ [FILTER BY KM] Skipping alert with invalid coordinates: ${alert._id}`);
            return false;
          }

          const distance = this.calculateDistanceInKilometers(
            latitude,
            longitude,
            alert.latitude,
            alert.longitude,
          );
          return distance <= distanceKm;
        } catch (error) {
          console.warn(`⚠️ [FILTER BY KM] Error calculating distance for alert ${alert._id}:`, error);
          return false;
        }
      });

      const safeAlerts = this.sanitizeAlerts(filteredAlerts);
      console.log(
        `✅ [FILTER BY KM] Filtered ${safeAlerts.length} alerts within ${distanceKm}km of (${latitude}, ${longitude})`,
      );
      return safeAlerts;
    } catch (error) {
      console.error(`❌ [FILTER BY KM] Error filtering alerts:`, error);
      return [];
    }
  }

  // Validate coordinate values
  private isValidCoordinate(lat: number, lon: number): boolean {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return false;
    }
    if (isNaN(lat) || isNaN(lon)) {
      return false;
    }
    if (!isFinite(lat) || !isFinite(lon)) {
      return false;
    }
    // Valid latitude: -90 to 90
    // Valid longitude: -180 to 180
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  // Calculate distance in kilometers using Haversine formula - with validation
  private calculateDistanceInKilometers(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    try {
      // Validate all inputs
      if (!this.isValidCoordinate(lat1, lon1) || !this.isValidCoordinate(lat2, lon2)) {
        throw new Error('Invalid coordinates for distance calculation');
      }

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

      // Ensure distance is a valid number
      if (!isFinite(distance) || distance < 0) {
        throw new Error('Invalid distance calculation result');
      }

      return distance;
    } catch (error) {
      console.error('❌ [HAVERSINE] Error calculating distance:', error);
      // Return a very large distance so alert is excluded from results
      return Infinity;
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Sanitize alerts to ensure safe data structure
  private sanitizeAlerts(alerts: any[]): any[] {
    return alerts.map((alert) => {
      try {
        return {
          _id: alert._id?.toString() || alert._id,
          userId: alert.userId?.toString() || alert.userId,
          type: alert.type || 'other',
          description: alert.description || '',
          latitude: typeof alert.latitude === 'number' ? alert.latitude : 0,
          longitude: typeof alert.longitude === 'number' ? alert.longitude : 0,
          photo: alert.photo || undefined,
          confirmations: typeof alert.confirmations === 'number' ? alert.confirmations : 0,
          denials: typeof alert.denials === 'number' ? alert.denials : 0,
          createdAt: alert.createdAt || new Date(),
          expiresAt: alert.expiresAt || undefined,
          roadName: alert.roadName || undefined,
          fullAddress: alert.fullAddress || undefined,
        };
      } catch (error) {
        console.warn('⚠️ [SANITIZE] Error sanitizing alert:', error);
        return null;
      }
    }).filter(alert => alert !== null);
  }

  // 🔍 GET ONE - Crash-proof
  async getAlertById(id: string): Promise<any> {
    try {
      if (!id || typeof id !== 'string') {
        throw new NotFoundException('Invalid alert ID');
      }

      const alert = await this.alertModel.findById(id).lean().exec();
      if (!alert) throw new NotFoundException('Alert not found');

      const safeAlert = this.sanitizeAlerts([alert])[0];
      return safeAlert;
    } catch (error) {
      console.error(`❌ [GET ONE] Error fetching alert ${id}:`, error);
      throw error;
    }
  }

  // 👍 CONFIRM - Crash-proof
  async confirmAlert(id: string): Promise<any> {
    try {
      if (!id || typeof id !== 'string') {
        throw new NotFoundException('Invalid alert ID');
      }

      const alert = await this.alertModel.findByIdAndUpdate(
        id,
        { $inc: { confirmations: 1 } },
        { new: true, lean: true },
      );

      if (!alert) throw new NotFoundException('Alert not found');

      this.alertsGateway.emitAlertConfirmed(alert).catch((error) => {
        console.error('❌ [CONFIRM] Error emitting alert_confirmed event:', error);
      });

      console.log(`✅ [CONFIRM] Alert ${id} confirmed`);
      return alert;
    } catch (error) {
      console.error(`❌ [CONFIRM] Error confirming alert ${id}:`, error);
      throw error;
    }
  }

  // 👎 DENY - Crash-proof
  async denyAlert(id: string): Promise<any> {
    try {
      if (!id || typeof id !== 'string') {
        throw new NotFoundException('Invalid alert ID');
      }

      const alert = await this.alertModel.findByIdAndUpdate(
        id,
        { $inc: { denials: 1 } },
        { new: true, lean: true },
      );

      if (!alert) throw new NotFoundException('Alert not found');

      this.alertsGateway.emitAlertDenied(alert).catch((error) => {
        console.error('❌ [DENY] Error emitting alert_denied event:', error);
      });

      console.log(`✅ [DENY] Alert ${id} denied`);
      return alert;
    } catch (error) {
      console.error(`❌ [DENY] Error denying alert ${id}:`, error);
      throw error;
    }
  }

  // 🗑️ DELETE - Crash-proof
  async deleteAlert(id: string) {
    try {
      if (!id || typeof id !== 'string') {
        throw new NotFoundException('Invalid alert ID');
      }

      const alert = await this.alertModel.findByIdAndDelete(id).lean();
      if (!alert) throw new NotFoundException('Alert not found');

      const alertId = (alert as any)._id?.toString() || id;
      this.alertsGateway.emitAlertDeleted(alertId).catch((error) => {
        console.error('❌ [DELETE] Error emitting alert_deleted event:', error);
      });

      console.log(`✅ [DELETE] Alert ${id} deleted`);
      return { message: 'Alert deleted' };
    } catch (error) {
      console.error(`❌ [DELETE] Error deleting alert ${id}:`, error);
      throw error;
    }
  }
}
