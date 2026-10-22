import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  revoke(id: number, revokedAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt },
    });
  }

  revokeAllForAdmin(adminId: number, revokedAt: Date): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.updateMany({
      where: { adminId, revokedAt: null },
      data: { revokedAt },
    });
  }
}
