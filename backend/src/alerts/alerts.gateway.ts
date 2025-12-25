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
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://urban-app-managments-production.up.railway.app',
      /^https:\/\/.*\.railway\.app$/,
      /^https:\/\/.*\.ngrok\.(io|app)$/,
    ],
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['authorization', 'content-type'],
  },
  transports: ['websocket', 'polling'], // Allow both for Railway proxy compatibility
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {
    // Ensure server is initialized
    if (!this.server) {
      console.warn('⚠️ [GATEWAY] Server not initialized');
    }
  }

  handleConnection(client: AuthenticatedSocket) {
    try {
      const auth = client.handshake.auth as SocketAuth | undefined;

      if (!auth?.token) {
        // Allow anonymous connections for viewing alerts
        console.log(`✅ [GATEWAY] Anonymous socket connected: ${client.id}`);
        client.data.userId = null;
        return;
      }

      try {
        const payload = this.jwtService.verify<{ id: string }>(auth.token);
        client.data.userId = payload.id;
        console.log(`✅ [GATEWAY] Authenticated socket connected: ${client.id} (userId: ${payload.id})`);
      } catch (jwtError) {
        // Invalid token, but still allow connection as anonymous
        console.log(`⚠️ [GATEWAY] Invalid token for ${client.id}, connecting as anonymous`);
        client.data.userId = null;
      }
    } catch (error) {
      console.error(`❌ [GATEWAY] Error in handleConnection for ${client.id}:`, error);
      // Still allow connection as anonymous
      client.data.userId = null;
    }
  }

  handleDisconnect(client: Socket) {
    try {
      console.log(`✅ [GATEWAY] Socket disconnected: ${client.id}`);
    } catch (error) {
      console.error(`❌ [GATEWAY] Error in handleDisconnect:`, error);
    }
  }

  // Defensive emit methods with error handling
  emitAlertCreated(alert: any): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!this.server) {
          console.error('❌ [GATEWAY] Server not initialized, cannot emit alert_created');
          resolve();
          return;
        }

        if (!alert) {
          console.warn('⚠️ [GATEWAY] Cannot emit alert_created: alert is null/undefined');
          resolve();
          return;
        }

        // Sanitize alert data before emitting
        const safeAlert = this.sanitizeAlertForEmission(alert);
        
        this.server.emit('alert_created', safeAlert);
        console.log(`✅ [GATEWAY] Emitted alert_created: ${safeAlert._id || 'unknown'}`);
        resolve();
      } catch (error) {
        console.error('❌ [GATEWAY] Error emitting alert_created:', error);
        resolve(); // Don't throw, just log
      }
    });
  }

  emitAlertConfirmed(alert: any): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!this.server || !alert) {
          console.warn('⚠️ [GATEWAY] Cannot emit alert_confirmed: server or alert missing');
          resolve();
          return;
        }

        const safeAlert = this.sanitizeAlertForEmission(alert);
        this.server.emit('alert_confirmed', safeAlert);
        console.log(`✅ [GATEWAY] Emitted alert_confirmed: ${safeAlert._id || 'unknown'}`);
        resolve();
      } catch (error) {
        console.error('❌ [GATEWAY] Error emitting alert_confirmed:', error);
        resolve();
      }
    });
  }

  emitAlertDenied(alert: any): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!this.server || !alert) {
          console.warn('⚠️ [GATEWAY] Cannot emit alert_denied: server or alert missing');
          resolve();
          return;
        }

        const safeAlert = this.sanitizeAlertForEmission(alert);
        this.server.emit('alert_denied', safeAlert);
        console.log(`✅ [GATEWAY] Emitted alert_denied: ${safeAlert._id || 'unknown'}`);
        resolve();
      } catch (error) {
        console.error('❌ [GATEWAY] Error emitting alert_denied:', error);
        resolve();
      }
    });
  }

  emitAlertDeleted(alertId: string | any): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!this.server) {
          console.error('❌ [GATEWAY] Server not initialized, cannot emit alert_deleted');
          resolve();
          return;
        }

        if (!alertId) {
          console.warn('⚠️ [GATEWAY] Cannot emit alert_deleted: alertId is missing');
          resolve();
          return;
        }

        // Handle both string IDs and object IDs
        const id = typeof alertId === 'string' ? alertId : (alertId?.toString() || '');
        
        if (!id) {
          console.warn('⚠️ [GATEWAY] Cannot emit alert_deleted: invalid alertId');
          resolve();
          return;
        }

        this.server.emit('alert_deleted', { id });
        console.log(`✅ [GATEWAY] Emitted alert_deleted: ${id}`);
        resolve();
      } catch (error) {
        console.error('❌ [GATEWAY] Error emitting alert_deleted:', error);
        resolve();
      }
    });
  }

  // Sanitize alert data before emitting to prevent crashes
  private sanitizeAlertForEmission(alert: any): any {
    try {
      return {
        _id: alert._id?.toString() || alert._id || null,
        userId: alert.userId?.toString() || alert.userId || null,
        type: typeof alert.type === 'string' ? alert.type : 'other',
        description: typeof alert.description === 'string' ? alert.description : undefined,
        latitude: typeof alert.latitude === 'number' ? alert.latitude : 0,
        longitude: typeof alert.longitude === 'number' ? alert.longitude : 0,
        photo: typeof alert.photo === 'string' ? alert.photo : undefined,
        confirmations: typeof alert.confirmations === 'number' ? alert.confirmations : 0,
        denials: typeof alert.denials === 'number' ? alert.denials : 0,
        createdAt: alert.createdAt || new Date().toISOString(),
        expiresAt: alert.expiresAt ? new Date(alert.expiresAt).toISOString() : undefined,
        roadName: typeof alert.roadName === 'string' ? alert.roadName : undefined,
        fullAddress: typeof alert.fullAddress === 'string' ? alert.fullAddress : undefined,
      };
    } catch (error) {
      console.error('❌ [GATEWAY] Error sanitizing alert for emission:', error);
      return {
        _id: null,
        type: 'other',
        latitude: 0,
        longitude: 0,
        confirmations: 0,
        denials: 0,
        createdAt: new Date().toISOString(),
      };
    }
  }
}
