import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import * as authRequest from '../auth/types/auth-request';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  // 🔴 CREATE ALERT (JWT)
  @UseGuards(JwtGuard)
  @Post()
  create(@Req() req: authRequest.AuthRequest, @Body() dto: CreateAlertDto) {
    return this.alertsService.createAlert(req.user.userId, dto);
  }

  // 🔍 GET ALL ALERTS (PUBLIC) - Crash-proof with validation
  @Get()
  async getAll(
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
    @Query('distanceKm') distanceKm?: string,
    @Query('userId') userId?: string,
  ): Promise<any[]> {
    try {
      // If userId is provided, filter by userId
      if (userId) {
        return await this.alertsService.getAlertsByUserId(userId);
      }
      
      // If lat, lon, and distanceKm are provided, filter by distance
      if (lat && lon && distanceKm) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        const distance = parseFloat(distanceKm);

        // Validate parsed values
        if (isNaN(latitude) || isNaN(longitude) || isNaN(distance)) {
          console.warn('⚠️ [GET ALL] Invalid query parameters, falling back to all alerts');
          return await this.alertsService.getAllAlerts();
        }

        return await this.alertsService.getAllAlertsFilteredByKilometers(
          latitude,
          longitude,
          distance,
        );
      }

      // Default: return all alerts
      return await this.alertsService.getAllAlerts();
    } catch (error) {
      console.error('❌ [GET ALL] Controller error:', error);
      // Return empty array instead of crashing
      return [];
    }
  }

  // 🔍 GET ONE ALERT (PUBLIC)
  @Get(':id')
  getOne(@Param('id') id: string): Promise<any> {
    return this.alertsService.getAlertById(id);
  }

  // 👍 CONFIRM ALERT (JWT)
  @UseGuards(JwtGuard)
  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.alertsService.confirmAlert(id);
  }

  // 👎 DENY ALERT (JWT)
  @UseGuards(JwtGuard)
  @Post(':id/deny')
  deny(@Param('id') id: string) {
    return this.alertsService.denyAlert(id);
  }

  // 🗑️ DELETE ALERT (JWT)
  @UseGuards(JwtGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.alertsService.deleteAlert(id);
  }
}
