import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { getJwtSecret } from './jwt-secret.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const password = await bcrypt.hash(registerDto.password, 12);
    let user: Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
    try {
      user = await this.prisma.user.create({
        data: {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          email: registerDto.email,
          password,
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }

    return this.createAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password: _password, ...publicUser } = user;
    return this.createAuthResponse(publicUser);
  }

  private async createAuthResponse(user: PublicUser) {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: getJwtSecret() },
    );
    return { user, accessToken };
  }
}
