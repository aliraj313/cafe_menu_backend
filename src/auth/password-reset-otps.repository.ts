import { Injectable } from '@nestjs/common';
import { PasswordResetOtp, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PasswordResetOtpsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PasswordResetOtpUncheckedCreateInput): Promise<PasswordResetOtp> {
    return this.prisma.passwordResetOtp.create({ data });
  }

  findLatestActiveForUser(userId: number, now: Date): Promise<PasswordResetOtp | null> {
    return this.prisma.passwordResetOtp.findFirst({
      where: {
        userId,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatestForUser(userId: number): Promise<PasswordResetOtp | null> {
    return this.prisma.passwordResetOtp.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  incrementAttempts(id: number): Promise<PasswordResetOtp> {
    return this.prisma.passwordResetOtp.update({
      where: { id },
      data: { attemptCount: { increment: 1 } },
    });
  }

  consume(id: number, consumedAt: Date): Promise<PasswordResetOtp> {
    return this.prisma.passwordResetOtp.update({
      where: { id },
      data: { consumedAt },
    });
  }

  consumeAllActiveForUser(userId: number, consumedAt: Date): Promise<Prisma.BatchPayload> {
    return this.prisma.passwordResetOtp.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt },
    });
  }
}
