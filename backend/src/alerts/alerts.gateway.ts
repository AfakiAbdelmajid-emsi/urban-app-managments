import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import {
  AuthenticatedSocket,
  SocketAuth,
} from './schemas/authenticated-socket';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      const auth = client.handshake.auth as SocketAuth | undefined;

      if (!auth?.token) {
        // Allow anonymous connections for viewing alerts
        console.log('👁️ Anonymous socket connected:', client.id);
        client.data.userId = null;
        return;
      }

      const payload = this.jwtService.verify<{ id: string }>(auth.token);
      client.data.userId = payload.id;
      console.log('🔐 Authenticated socket connected:', payload.id);
    } catch (error) {
      // Invalid token, but still allow connection as anonymous
      console.log('⚠️ Invalid token, connecting as anonymous:', client.id);
      client.data.userId = null;
    }
  }

  handleDisconnect(client: Socket) {
    console.log('❌ SOCKET DISCONNECTED:', client.id);
  }

  emitAlertCreated(alert: any) {
    this.server.emit('alert_created', alert);
  }

  emitAlertConfirmed(alert: any) {
    this.server.emit('alert_confirmed', alert);
  }

  emitAlertDenied(alert: any) {
    this.server.emit('alert_denied', alert);
  }

  emitAlertDeleted(alertId: string) {
    this.server.emit('alert_deleted', { id: alertId });
  }
}
