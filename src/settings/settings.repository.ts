import { Injectable } from '@nestjs/common';
import { Prisma, Settings } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Settings | null> {
    return this.prisma.settings.findUnique({ where: { id } });
  }

  create(data: Prisma.SettingsCreateInput): Promise<Settings> {
    return this.prisma.settings.create({ data });
  }

  update(id: string, data: Prisma.SettingsUpdateInput): Promise<Settings> {
    return this.prisma.settings.update({ where: { id }, data });
  }
}
