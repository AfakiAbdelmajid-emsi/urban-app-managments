import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import type { AuthRequest } from '../auth/types/auth-request';

interface AiResponse {
  answer: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly http: HttpService) {}

  @UseGuards(JwtGuard)
  @Post('ask')
  async askAI(
    @Req() req: AuthRequest,
    @Body('message') message: string,
  ): Promise<AiResponse> {
    const response = await firstValueFrom(
      this.http.post<AiResponse>('/ask', {
        userId: req.user.userId,
        message,
      }),
    );

    return response.data;
  }
}
