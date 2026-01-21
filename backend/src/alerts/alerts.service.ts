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

  // 🔍 Find duplicate alerts (same type, within 100m, created in last 10 minutes)
  private async findDuplicateAlert(
    type: string,
    latitude: number,
    longitude: number,
    excludeUserId?: string,
  ): Promise<AlertDocument | null> {
    try {
     
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

     
      const recentAlerts = await this.alertModel
        .find({
          type: type.toLowerCase(),
          status: 'ACTIVE', 
          createdAt: { $gte: tenMinutesAgo },
          userId: { $ne: excludeUserId }, 
        })
        .lean()
        .exec();

      
      const maxDistance = 0.1; 
      for (const alert of recentAlerts) {
        const distance = this.calculateDistanceInKilometers(
          latitude,
          longitude,
          alert.latitude,
          alert.longitude,
        );

        
        if (distance <= maxDistance) {
          console.log(
            `🔍 [DUPLICATE] Found duplicate alert ${alert._id} at ${distance.toFixed(3)}km distance`,
          );
          
          const fullAlert = await this.alertModel.findById(alert._id);
          return fullAlert;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ [DUPLICATE] Error finding duplicate alert:', error);
      return null; // Continue with creation if check fails
    }
  }

  // 🔴 CREATE - Crash-proof with validation + Duplicate Detection
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

      // 🔍 Check for duplicate alerts (same type, within 100m, last 10 minutes)
      const duplicateAlert = await this.findDuplicateAlert(
        dto.type,
        dto.latitude,
        dto.longitude,
        userId,
      );

      if (duplicateAlert) {
        console.log(
          `🔄 [DUPLICATE] Duplicate detected! Merging with alert ${duplicateAlert._id}`,
        );

        // Don't create new alert - instead, add user to confirmedBy (if not already there)
        if (!duplicateAlert.confirmedBy.includes(userId)) {
          if (!Array.isArray(duplicateAlert.confirmedBy)) {
            duplicateAlert.confirmedBy = [];
          }
          duplicateAlert.confirmedBy.push(userId);
          duplicateAlert.confirmations = duplicateAlert.confirmedBy.length;

          // Recalculate confidence score
          const oldStatus = duplicateAlert.status;
          duplicateAlert.confidenceScore = await this.calculateConfidenceScore(duplicateAlert);

          // Save updated alert
          await duplicateAlert.save();

          // Check state transitions
          const newStatus = await this.updateAlertState(
            duplicateAlert._id.toString(),
            duplicateAlert.confidenceScore,
          );

          // Reload alert with updated status
          const updatedAlert = await this.alertModel.findById(duplicateAlert._id).lean();

          // If status changed to final state, update creator trust score (only once)
          if (oldStatus === 'ACTIVE' && (newStatus === 'VERIFIED' || newStatus === 'REJECTED')) {
            await this.updateCreatorTrustScore(updatedAlert as any, newStatus);
          }

          // Emit events (treat as confirmation)
          this.alertsGateway.emitAlertConfirmed(updatedAlert).catch((error) => {
            console.error('❌ [DUPLICATE] Error emitting alert_confirmed event:', error);
          });

          if (newStatus !== oldStatus) {
            if (newStatus === 'VERIFIED') {
              this.alertsGateway.emitAlertVerified(updatedAlert).catch((error) => {
                console.error('❌ [DUPLICATE] Error emitting alert_verified event:', error);
              });
            } else if (newStatus === 'REJECTED') {
              this.alertsGateway.emitAlertRejected(updatedAlert).catch((error) => {
                console.error('❌ [DUPLICATE] Error emitting alert_rejected event:', error);
              });
            }
          }

          this.alertsGateway.emitConfidenceUpdated(updatedAlert).catch((error) => {
            console.error('❌ [DUPLICATE] Error emitting confidence_updated event:', error);
          });

          console.log(
            `✅ [DUPLICATE] Merged with existing alert ${duplicateAlert._id}. Confirmations: ${duplicateAlert.confirmations}, Status: ${newStatus}`,
          );

          // Return the updated alert (sanitized)
          return this.sanitizeAlerts([updatedAlert as any])[0];
        } else {
          // User already confirmed this alert, just return it
          console.log(
            `ℹ️ [DUPLICATE] User already confirmed duplicate alert ${duplicateAlert._id}`,
          );
          const alertDoc = await this.alertModel.findById(duplicateAlert._id).lean();
          return this.sanitizeAlerts([alertDoc as any])[0];
        }
      }

      // No duplicate found - create new alert
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

      console.log(`✅ [CREATE] New alert created: ${alert._id}`);
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

      
      for (const userId of alert.confirmedBy || []) {
        try {
          const user = await this.usersService.getUser(userId);
          confidence += user.trustScore || 1.0;
        } catch (error) {
          console.warn(`⚠️ [CONFIDENCE] Could not get trust score for user ${userId}, using default 1.0`);
          confidence += 1.0;
        }
      }

      
      confidence -= (alert.denials || 0);

      return Math.round(confidence * 10) / 10; 
    } catch (error) {
      console.error('❌ [CONFIDENCE] Error calculating confidence score:', error);
      return 0;
    }
  }

  private async updateAlertState(alertId: string, confidenceScore: number): Promise<'ACTIVE' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'> {
    const alert = await this.alertModel.findById(alertId).lean();
    if (!alert) {
      console.warn(`⚠️ [STATE] Alert ${alertId} not found`);
      return 'ACTIVE';
    }

    if (alert.expiresAt && new Date(alert.expiresAt) < new Date()) {
      if (alert.status !== 'EXPIRED') {
        await this.alertModel.findByIdAndUpdate(alertId, { status: 'EXPIRED' });
      }
      return 'EXPIRED';
    }

    if (alert.status === 'VERIFIED' || alert.status === 'REJECTED') {
      console.log(`ℹ️ [STATE] Alert ${alertId} already in final state: ${alert.status}`);
      return alert.status as 'VERIFIED' | 'REJECTED';
    }

    let newStatus: 'ACTIVE' | 'VERIFIED' | 'REJECTED' = 'ACTIVE';

    const confirmationsCount = alert.confirmations || 0;
    const confirmedByCount = Array.isArray(alert.confirmedBy) ? alert.confirmedBy.length : 0;
    
    console.log(`🔍 [STATE] Alert ${alertId} - confirmations: ${confirmationsCount}, confirmedBy: ${confirmedByCount}, current status: ${alert.status}`);
    
    const actualConfirmations = confirmationsCount > 0 ? confirmationsCount : confirmedByCount;
    
    if (actualConfirmations >= 3) {
      newStatus = 'VERIFIED';
      console.log(`✅ [STATE] Alert ${alertId} should be VERIFIED (confirmations: ${actualConfirmations})`);
    } else if (confidenceScore <= -3) {
      newStatus = 'REJECTED';
    } else {
      newStatus = 'ACTIVE';
    }

    // Update alert status if changed
    if (newStatus !== alert.status) {
      console.log(`🔄 [STATE] Updating alert ${alertId} status: ${alert.status} → ${newStatus}`);
      await this.alertModel.findByIdAndUpdate(alertId, {
        status: newStatus,
        verified: newStatus === 'VERIFIED',
      });
    } else {
      console.log(`ℹ️ [STATE] Alert ${alertId} status unchanged: ${alert.status}`);
    }

    return newStatus;
  }

  
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
      

     
      newTrustScore = Math.max(0.1, Math.min(5.0, newTrustScore));

      
      await this.userModel.findByIdAndUpdate(alert.userId, { trustScore: newTrustScore });
    } catch (error) {
      console.error('[TRUST] Error updating creator trust score:', error);
      
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

      // Add to confirmedBy (ensure it's an array)
      if (!Array.isArray(alert.confirmedBy)) {
        alert.confirmedBy = [];
      }
      alert.confirmedBy.push(voterId);
      alert.confirmations = alert.confirmedBy.length;

      console.log(`📊 [CONFIRM] Alert ${id} - After adding ${voterId}, confirmations: ${alert.confirmations}, confirmedBy: ${alert.confirmedBy.length}`);

      // Recalculate confidence score
      const oldStatus = alert.status;
      alert.confidenceScore = await this.calculateConfidenceScore(alert);

      // Save alert
      await alert.save();
      console.log(`💾 [CONFIRM] Alert ${id} saved with confirmations: ${alert.confirmations}, status: ${alert.status}`);

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

      console.log(`✅ [CONFIRM] Alert ${id} confirmed by user ${voterId}. Confirmations: ${alert.confirmations}, Status: ${newStatus}`);
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

      console.log(`✅ [DENY] Alert ${id} denied by user ${voterId}. Confirmations: ${alert.confirmations}, Status: ${newStatus}`);
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
