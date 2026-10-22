import { Injectable } from '@nestjs/common';
import { Otp, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OtpsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.OtpUncheckedCreateInput): Promise<Otp> {
    return this.prisma.otp.create({ data });
  }

  findLatestActiveForUser(userId: number, now: Date): Promise<Otp | null> {
    return this.prisma.otp.findFirst({
      where: {
        userId,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatestForUser(userId: number): Promise<Otp | null> {
    return this.prisma.otp.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  incrementAttempts(id: number): Promise<Otp> {
    return this.prisma.otp.update({
      where: { id },
      data: { attemptCount: { increment: 1 } },
    });
  }

  consume(id: number, consumedAt: Date): Promise<Otp> {
    return this.prisma.otp.update({
      where: { id },
      data: { consumedAt },
    });
  }

  consumeAllActiveForUser(userId: number, consumedAt: Date): Promise<Prisma.BatchPayload> {
    return this.prisma.otp.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt },
    });
  }
}
