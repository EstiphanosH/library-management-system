import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './jwt-secret.js';
import { JwtPayload } from './jwt-payload.interface.js';

interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  validate(payload: TokenPayload): JwtPayload {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
