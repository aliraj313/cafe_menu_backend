import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminOrdersGateway } from './admin-orders.gateway';

@Module({
  imports: [AuthModule],
  providers: [AdminOrdersGateway],
  exports: [AdminOrdersGateway],
})
export class RealtimeModule {}
