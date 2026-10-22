import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigsModule } from './config/configs.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ConfigsModule,
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
