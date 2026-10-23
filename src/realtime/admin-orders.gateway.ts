import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { UserRole } from '../generated/prisma/client';
import { ConfigsService } from '../config/configs.service';
import { AccessTokenPayload } from '../auth/auth.types';
import { UsersRepository } from '../auth/users.repository';
import { OrderResponse } from '../orders/order.mapper';

@WebSocketGateway({
  namespace: '/admin',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class AdminOrdersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AdminOrdersGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configs: ConfigsService,
    private readonly usersRepository: UsersRepository,
  ) {}

  afterInit(server: Server): void {
    // Restrict browser origins to configured frontend when possible.
    server.engine.on('initial_headers', () => undefined);
    this.logger.log(
      `Admin websocket ready on namespace /${this.configs.WS.NAMESPACE}`,
    );
  }

  async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.disconnectUnauthorized(client, 'Missing access token');
        return;
      }

      let payload: AccessTokenPayload;
      try {
        payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
          secret: this.configs.JWT.ACCESS.SECRET,
        });
      } catch {
        this.disconnectUnauthorized(client, 'Invalid or expired access token');
        return;
      }

      if (payload.type !== 'access') {
        this.disconnectUnauthorized(client, 'Invalid token type');
        return;
      }

      const user = await this.usersRepository.findById(payload.sub);
      if (!user || !user.isActive || user.role !== UserRole.ADMIN) {
        this.disconnectUnauthorized(client, 'Admin role required');
        return;
      }

      client.data.user = {
        id: user.id,
        mobile: user.mobile,
        role: user.role,
      };

      await client.join(this.configs.WS.ROOM_ADMINS);
      this.logger.log(`Admin ${user.id} connected to websocket (${client.id})`);
    } catch (err) {
      this.logger.error({ err }, 'Websocket connection error');
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket): void {
    const userId = (client.data as { user?: { id: number } })?.user?.id;
    this.logger.log(`Client disconnected: ${client.id}${userId ? ` (admin ${userId})` : ''}`);
  }

  /**
   * Broadcast a paid/processing order to all connected admin subscribers.
   */
  emitOrderPaid(order: OrderResponse): void {
    if (!this.server) {
      this.logger.warn('Websocket server not ready; skipped order.paid emit');
      return;
    }
    this.server
      .to(this.configs.WS.ROOM_ADMINS)
      .emit(this.configs.WS.EVENTS.ORDER_PAID, {
        success: true,
        data: order,
      });
    this.logger.log(`Emitted ${this.configs.WS.EVENTS.ORDER_PAID} for order ${order.id}`);
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.trim()) {
      return header.replace(/^Bearer\s+/i, '').trim();
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return queryToken.replace(/^Bearer\s+/i, '').trim();
    }

    return null;
  }

  private disconnectUnauthorized(client: Socket, reason: string): void {
    this.logger.warn(`WS unauthorized (${client.id}): ${reason}`);
    client.emit('error', { success: false, error: { code: 'WS_UNAUTHORIZED', message: reason } });
    client.disconnect(true);
  }
}
