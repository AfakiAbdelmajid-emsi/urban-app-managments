import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
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

  // 🔍 GET ALL ALERTS (PUBLIC)
  @Get()
  getAll() {
    return this.alertsService.getAllAlerts();
  }

  // 🔍 GET ONE ALERT (PUBLIC)
  @Get(':id')
  getOne(@Param('id') id: string) {
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
