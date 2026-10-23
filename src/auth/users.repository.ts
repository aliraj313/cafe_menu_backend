import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByMobile(mobile: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { mobile } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  upsertByMobile(mobile: string, role: UserRole): Promise<User> {
    return this.prisma.user.upsert({
      where: { mobile },
      update: {
        isActive: true,
      },
      create: {
        mobile,
        role,
        isActive: true,
      },
    });
  }

  updatePassword(id: number, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}
