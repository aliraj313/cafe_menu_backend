import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardOverviewResponse, DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/overview')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary:
      'Admin overview: open status, today sales/orders, product availability counts, recent orders',
  })
  getOverview(): Promise<DashboardOverviewResponse> {
    return this.dashboardService.getOverview();
  }
}
