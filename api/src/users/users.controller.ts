import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { JwtPayload } from '../auth/jwt-payload.interface.js';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('users')
export class UsersController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: AuthenticatedRequest) {
    return request.user;
  }
}
