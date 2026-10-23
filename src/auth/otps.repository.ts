import { Injectable } from '@nestjs/common';
import { Otp, OtpPurpose, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OtpsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.OtpUncheckedCreateInput): Promise<Otp> {
    return this.prisma.otp.create({ data });
  }

  findLatestActive(
    mobile: string,
    purpose: OtpPurpose,
    now: Date,
  ): Promise<Otp | null> {
    return this.prisma.otp.findFirst({
      where: {
        mobile,
        purpose,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatest(mobile: string, purpose: OtpPurpose): Promise<Otp | null> {
    return this.prisma.otp.findFirst({
      where: { mobile, purpose },
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

  consumeAllActive(
    mobile: string,
    purpose: OtpPurpose,
    consumedAt: Date,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.otp.updateMany({
      where: { mobile, purpose, consumedAt: null },
      data: { consumedAt },
    });
  }
}
