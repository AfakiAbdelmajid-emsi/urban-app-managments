import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument } from './schemas/alert.schema';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AlertsGateway } from './alerts.gateway';
import { CloudinaryService } from '../utils/cloudinary.service';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly alertsGateway: AlertsGateway,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
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
        confidenceScore: 0,
        confirmedBy: [],
        deniedBy: [],
        verified: false,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
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
          confidenceScore: typeof alert.confidenceScore === 'number' ? alert.confidenceScore : 0,
          confirmedBy: Array.isArray(alert.confirmedBy) ? alert.confirmedBy.map((id: any) => id?.toString() || id) : [],
          deniedBy: Array.isArray(alert.deniedBy) ? alert.deniedBy.map((id: any) => id?.toString() || id) : [],
          verified: typeof alert.verified === 'boolean' ? alert.verified : false,
          status: alert.status || 'ACTIVE',
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

  // Calculate confidence score based on confirming users' trust scores minus denials
  private async calculateConfidenceScore(alert: any): Promise<number> {
    try {
      let confidence = 0;

      // Sum trust scores of all confirming users
      for (const userId of alert.confirmedBy || []) {
        try {
          const user = await this.usersService.getUser(userId);
          confidence += user.trustScore || 1.0;
        } catch (error) {
          console.warn(`⚠️ [CONFIDENCE] Could not get trust score for user ${userId}, using default 1.0`);
          confidence += 1.0;
        }
      }

      // Subtract denials (simple count)
      confidence -= (alert.denials || 0);

      return Math.round(confidence * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('❌ [CONFIDENCE] Error calculating confidence score:', error);
      return 0;
    }
  }

  // Check and update alert state based on confidence score
  private async updateAlertState(alertId: string, confidenceScore: number): Promise<'ACTIVE' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'> {
    const alert = await this.alertModel.findById(alertId).lean();
    if (!alert) return 'ACTIVE';

    // Check if expired first (expired alerts can't change status)
    if (alert.expiresAt && new Date(alert.expiresAt) < new Date()) {
      if (alert.status !== 'EXPIRED') {
        await this.alertModel.findByIdAndUpdate(alertId, { status: 'EXPIRED' });
      }
      return 'EXPIRED';
    }

    // Don't change status if already in final state (unless expired)
    if (alert.status === 'VERIFIED' || alert.status === 'REJECTED') {
      return alert.status as 'VERIFIED' | 'REJECTED';
    }

    let newStatus: 'ACTIVE' | 'VERIFIED' | 'REJECTED' = 'ACTIVE';

    if (confidenceScore >= 5) {
      newStatus = 'VERIFIED';
    } else if (confidenceScore <= -3) {
      newStatus = 'REJECTED';
    } else {
      newStatus = 'ACTIVE';
    }

    // Update alert status if changed
    if (newStatus !== alert.status) {
      await this.alertModel.findByIdAndUpdate(alertId, {
        status: newStatus,
        verified: newStatus === 'VERIFIED',
      });
    }

    return newStatus;
  }

  // Update creator's trust score when alert reaches final state
  private async updateCreatorTrustScore(alert: any, finalStatus: 'VERIFIED' | 'REJECTED' | 'EXPIRED'): Promise<void> {
    try {
      if (!alert.userId) return;

      const user = await this.usersService.getUser(alert.userId);
      let newTrustScore = user.trustScore || 1.0;

      if (finalStatus === 'VERIFIED') {
        newTrustScore += 0.1;
        console.log(`📈 [TRUST] User ${alert.userId} trust increased: ${user.trustScore} → ${newTrustScore}`);
      } else if (finalStatus === 'REJECTED') {
        newTrustScore -= 0.2;
        console.log(`📉 [TRUST] User ${alert.userId} trust decreased: ${user.trustScore} → ${newTrustScore}`);
      }
      // EXPIRED: no change to trust score

      // Clamp between 0.1 and 5.0
      newTrustScore = Math.max(0.1, Math.min(5.0, newTrustScore));

      // Update user trust score
      await this.userModel.findByIdAndUpdate(alert.userId, { trustScore: newTrustScore });
    } catch (error) {
      console.error('❌ [TRUST] Error updating creator trust score:', error);
      // Don't throw - trust update failure shouldn't break the flow
    }
  }

  // 👍 CONFIRM - With Trust System
  async confirmAlert(id: string, voterId: string): Promise<any> {
    try {
      if (!id || typeof id !== 'string') {
        throw new NotFoundException('Invalid alert ID');
      }

      if (!voterId || typeof voterId !== 'string') {
        throw new BadRequestException('Voter ID is required');
      }

      // Get alert
      const alert = await this.alertModel.findById(id);
      if (!alert) throw new NotFoundException('Alert not found');

      // Check if user is the creator
      if (alert.userId === voterId) {
        throw new BadRequestException('You cannot vote on your own alert');
      }

      // Check if user already voted
      if (alert.confirmedBy.includes(voterId)) {
        throw new BadRequestException('You have already confirmed this alert');
      }

      // Remove from deniedBy if they previously denied
      if (alert.deniedBy.includes(voterId)) {
        alert.deniedBy = alert.deniedBy.filter((id: string) => id !== voterId);
        alert.denials = Math.max(0, alert.denials - 1);
      }

      // Add to confirmedBy
      alert.confirmedBy.push(voterId);
      alert.confirmations = alert.confirmedBy.length;

      // Recalculate confidence score
      const oldStatus = alert.status;
      alert.confidenceScore = await this.calculateConfidenceScore(alert);

      // Save alert
      await alert.save();

      // Check state transitions
      const newStatus = await this.updateAlertState(id, alert.confidenceScore);

      // Reload alert with updated status
      const updatedAlert = await this.alertModel.findById(id).lean();

      // If status changed to final state, update creator trust score (only once)
      if (oldStatus === 'ACTIVE' && (newStatus === 'VERIFIED' || newStatus === 'REJECTED')) {
        await this.updateCreatorTrustScore(updatedAlert, newStatus);
      }

      // Emit events
      this.alertsGateway.emitAlertConfirmed(updatedAlert).catch((error) => {
        console.error('❌ [CONFIRM] Error emitting alert_confirmed event:', error);
      });

      if (newStatus !== oldStatus) {
        if (newStatus === 'VERIFIED') {
          this.alertsGateway.emitAlertVerified(updatedAlert).catch((error) => {
            console.error('❌ [CONFIRM] Error emitting alert_verified event:', error);
          });
        } else if (newStatus === 'REJECTED') {
          this.alertsGateway.emitAlertRejected(updatedAlert).catch((error) => {
            console.error('❌ [CONFIRM] Error emitting alert_rejected event:', error);
          });
        }
      }

      this.alertsGateway.emitConfidenceUpdated(updatedAlert).catch((error) => {
        console.error('❌ [CONFIRM] Error emitting confidence_updated event:', error);
      });

      console.log(`✅ [CONFIRM] Alert ${id} confirmed by user ${voterId}. Confidence: ${alert.confidenceScore}, Status: ${newStatus}`);
      return updatedAlert;
    } catch (error) {
      console.error(`❌ [CONFIRM] Error confirming alert ${id}:`, error);
      throw error;
    }
  }

  // 👎 DENY - With Trust System
  async denyAlert(id: string, voterId: string): Promise<any> {
    try {
      if (!id || typeof id !== 'string') {
        throw new NotFoundException('Invalid alert ID');
      }

      if (!voterId || typeof voterId !== 'string') {
        throw new BadRequestException('Voter ID is required');
      }

      // Get alert
      const alert = await this.alertModel.findById(id);
      if (!alert) throw new NotFoundException('Alert not found');

      // Check if user is the creator
      if (alert.userId === voterId) {
        throw new BadRequestException('You cannot vote on your own alert');
      }

      // Check if user already voted
      if (alert.deniedBy.includes(voterId)) {
        throw new BadRequestException('You have already denied this alert');
      }

      // Remove from confirmedBy if they previously confirmed
      if (alert.confirmedBy.includes(voterId)) {
        alert.confirmedBy = alert.confirmedBy.filter((id: string) => id !== voterId);
        alert.confirmations = Math.max(0, alert.confirmations - 1);
      }

      // Add to deniedBy
      alert.deniedBy.push(voterId);
      alert.denials = alert.deniedBy.length;

      // Recalculate confidence score
      const oldStatus = alert.status;
      alert.confidenceScore = await this.calculateConfidenceScore(alert);

      // Save alert
      await alert.save();

      // Check state transitions
      const newStatus = await this.updateAlertState(id, alert.confidenceScore);

      // Reload alert with updated status
      const updatedAlert = await this.alertModel.findById(id).lean();

      // If status changed to final state, update creator trust score (only once)
      if (oldStatus === 'ACTIVE' && (newStatus === 'VERIFIED' || newStatus === 'REJECTED')) {
        await this.updateCreatorTrustScore(updatedAlert, newStatus);
      }

      // Emit events
      this.alertsGateway.emitAlertDenied(updatedAlert).catch((error) => {
        console.error('❌ [DENY] Error emitting alert_denied event:', error);
      });

      if (newStatus !== oldStatus) {
        if (newStatus === 'VERIFIED') {
          this.alertsGateway.emitAlertVerified(updatedAlert).catch((error) => {
            console.error('❌ [DENY] Error emitting alert_verified event:', error);
          });
        } else if (newStatus === 'REJECTED') {
          this.alertsGateway.emitAlertRejected(updatedAlert).catch((error) => {
            console.error('❌ [DENY] Error emitting alert_rejected event:', error);
          });
        }
      }

      this.alertsGateway.emitConfidenceUpdated(updatedAlert).catch((error) => {
        console.error('❌ [DENY] Error emitting confidence_updated event:', error);
      });

      console.log(`✅ [DENY] Alert ${id} denied by user ${voterId}. Confidence: ${alert.confidenceScore}, Status: ${newStatus}`);
      return updatedAlert;
    } catch (error) {
      console.error(`❌ [DENY] Error denying alert ${id}:`, error);
      throw error;
    }
  }

  // 🗑️ DELETE - Crash-proof with Cloudinary cleanup
  async deleteAlert(id: string) {
    try {
      if (!id || typeof id !== 'string') {
        throw new NotFoundException('Invalid alert ID');
      }

      const alert = await this.alertModel.findById(id).lean();
      if (!alert) throw new NotFoundException('Alert not found');

      // Delete image from Cloudinary if it exists
      if ((alert as any).photo) {
        try {
          await this.cloudinaryService.deleteImage((alert as any).photo);
        } catch (cloudinaryError) {
          console.warn(`⚠️ [DELETE] Failed to delete image from Cloudinary: ${cloudinaryError}`);
          // Continue with alert deletion even if image deletion fails
        }
      }

      await this.alertModel.findByIdAndDelete(id);

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
