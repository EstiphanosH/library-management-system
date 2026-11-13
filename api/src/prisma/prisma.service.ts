
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';
import { validateDatabaseUrl } from './database-url.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    validateDatabaseUrl(process.env.DATABASE_URL);
    await this.$connect();
    console.log('Database connected successfully.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    console.log('Database disconnected successfully.');
  }
}
