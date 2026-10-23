import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CartsModule } from '../carts/carts.module';
import { OrdersModule } from '../orders/orders.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SettingsModule } from '../settings/settings.module';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { ZarinpalService } from './zarinpal/zarinpal.service';

@Module({
  imports: [
    forwardRef(() => OrdersModule),
    CartsModule,
    RealtimeModule,
    SettingsModule,
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, ZarinpalService],
  exports: [PaymentsRepository, ZarinpalService],
})
export class PaymentsModule {}
