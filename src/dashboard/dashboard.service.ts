import { Injectable } from '@nestjs/common';
import { ConfigsService } from '../config/configs.service';
import { OrdersRepository } from '../orders/orders.repository';
import { toOrderResponse, OrderResponse } from '../orders/order.mapper';
import { ProductsRepository } from '../products/products.repository';
import { SettingsService } from '../settings/settings.service';

export interface DashboardOverviewResponse {
  isOpen: boolean;
  stats: {
    /** Paid sales today in Toman (integer string) */
    todaySales: string;
    /** Orders created today */
    todayOrdersCount: number;
    unavailableProductsCount: number;
    availableProductsCount: number;
    totalProductsCount: number;
  };
  recentOrders: OrderResponse[];
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly settingsService: SettingsService,
    private readonly configs: ConfigsService,
  ) {}

  async getOverview(): Promise<DashboardOverviewResponse> {
    const { start, end } = this.getTodayRangeInBusinessTz();

    const [
      settings,
      todaySales,
      todayOrdersCount,
      unavailableProductsCount,
      availableProductsCount,
      totalProductsCount,
      recent,
    ] = await Promise.all([
      this.settingsService.get(),
      this.ordersRepository.sumPaidAmountBetween(start, end),
      this.ordersRepository.countCreatedBetween(start, end),
      this.productsRepository.countByAvailability(false),
      this.productsRepository.countByAvailability(true),
      this.productsRepository.countAll(),
      this.ordersRepository.findRecent(this.configs.LIMITS.DASHBOARD.RECENT_ORDERS_LIMIT),
    ]);

    return {
      isOpen: settings.isOpen,
      stats: {
        todaySales: todaySales.toString(),
        todayOrdersCount,
        unavailableProductsCount,
        availableProductsCount,
        totalProductsCount,
      },
      recentOrders: recent.map(toOrderResponse),
    };
  }

  /**
   * Start (inclusive) and end (exclusive) of the current calendar day in BUSINESS_TIMEZONE,
   * as UTC Date values for Prisma filters.
   */
  private getTodayRangeInBusinessTz(): { start: Date; end: Date } {
    const timeZone = this.configs.BUSINESS_TIMEZONE;
    const now = new Date();
    const dayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const [year, month, day] = dayKey.split('-').map(Number);
    const startMs = this.zonedBoundaryToUtc(year, month, day, 0, 0, 0, timeZone);
    const endMs = this.zonedBoundaryToUtc(year, month, day + 1, 0, 0, 0, timeZone);

    return { start: new Date(startMs), end: new Date(endMs) };
  }

  private zonedBoundaryToUtc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    timeZone: string,
  ): number {
    let guess = Date.UTC(year, month - 1, day, hour, minute, second, 0);
    for (let i = 0; i < 3; i++) {
      const parts = this.getTzParts(new Date(guess), timeZone);
      const asUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
      );
      const target = Date.UTC(year, month - 1, day, hour, minute, second, 0);
      guess += target - asUtc;
    }
    return guess;
  }

  private getTzParts(
    date: Date,
    timeZone: string,
  ): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = fmt.formatToParts(date);
    const get = (type: string): number =>
      Number(parts.find((p) => p.type === type)?.value ?? '0');
    return {
      year: get('year'),
      month: get('month'),
      day: get('day'),
      hour: get('hour'),
      minute: get('minute'),
      second: get('second'),
    };
  }
}
