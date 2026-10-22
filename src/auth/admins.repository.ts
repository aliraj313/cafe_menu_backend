import { Injectable } from '@nestjs/common';
import { Admin, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number): Promise<Admin | null> {
    return this.prisma.admin.findUnique({ where: { id } });
  }

  findByUsername(username: string): Promise<Admin | null> {
    return this.prisma.admin.findUnique({ where: { username } });
  }

  create(data: Prisma.AdminCreateInput): Promise<Admin> {
    return this.prisma.admin.create({ data });
  }
}
