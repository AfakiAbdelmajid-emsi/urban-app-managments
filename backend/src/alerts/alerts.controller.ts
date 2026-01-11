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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import * as authRequest from '../auth/types/auth-request';
import { CloudinaryService } from '../utils/cloudinary.service';
import { imageFileFilter } from '../utils/file-upload.util';

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // 🔴 CREATE ALERT (JWT) - With Cloudinary file upload
  @UseGuards(JwtGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async create(
    @Req() req: authRequest.AuthRequest,
    @Body() body: any,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)/i }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    // Parse FormData - convert strings to proper types
    // FormData sends all values as strings, so we need to parse numbers
    const latitude = typeof body.latitude === 'string' ? parseFloat(body.latitude) : Number(body.latitude);
    const longitude = typeof body.longitude === 'string' ? parseFloat(body.longitude) : Number(body.longitude);

    // Log received values for debugging
    console.log('📥 [CREATE] Received body:', {
      type: body.type,
      latitude: body.latitude,
      longitude: body.longitude,
      latitudeType: typeof body.latitude,
      longitudeType: typeof body.longitude,
    });

    // Validate parsed coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      console.error('❌ [CREATE] Invalid coordinates received:', {
        latitude: body.latitude,
        longitude: body.longitude,
        parsedLatitude: latitude,
        parsedLongitude: longitude,
      });
      throw new Error(`Invalid coordinates: latitude=${body.latitude}, longitude=${body.longitude}`);
    }

    const dto: CreateAlertDto = {
      type: body.type,
      description: body.description || undefined,
      latitude,
      longitude,
      roadName: body.roadName || undefined,
      fullAddress: body.fullAddress || undefined,
    };

    // Upload to Cloudinary if file exists
    if (file) {
      try {
        console.log('📤 [CREATE] Uploading image to Cloudinary...');
        const imageUrl = await this.cloudinaryService.uploadImage(file);
        dto.photo = imageUrl;
        console.log('✅ [CREATE] Image uploaded:', imageUrl);
      } catch (error) {
        console.error('❌ [CREATE] Cloudinary upload failed:', error);
        throw new Error('Failed to upload image');
      }
    }

    console.log('✅ [CREATE] Creating alert with DTO:', {
      type: dto.type,
      latitude: dto.latitude,
      longitude: dto.longitude,
      hasPhoto: !!dto.photo,
    });

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
  confirm(@Param('id') id: string, @Req() req: authRequest.AuthRequest) {
    return this.alertsService.confirmAlert(id, req.user.userId);
  }

  // 👎 DENY ALERT (JWT)
  @UseGuards(JwtGuard)
  @Post(':id/deny')
  deny(@Param('id') id: string, @Req() req: authRequest.AuthRequest) {
    return this.alertsService.denyAlert(id, req.user.userId);
  }

  // 🗑️ DELETE ALERT (JWT)
  @UseGuards(JwtGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.alertsService.deleteAlert(id);
  }
}
