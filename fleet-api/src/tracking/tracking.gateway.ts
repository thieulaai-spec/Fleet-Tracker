import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { GpsUpdateDto } from './dto/gps-update.dto';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import * as cookie from 'cookie';

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : 'http://localhost:3000';

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  namespace: 'tracking',
})
export class TrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('TrackingGateway');

  constructor(
    private readonly trackingService: TrackingService,
    private readonly jwtService: JwtService,
  ) {}

  @OnEvent('alert.new')
  handleNewAlert(payload: any) {
    this.logger.log(`Broadcasting alert: ${payload.type}`);
    this.server.to('admin').emit('alert:new', payload);

    // Also notify the driver if relevant
    if (payload.driverId) {
      this.server.to(`driver:${payload.driverId}`).emit('alert:yours', payload);
    }
  }

  @OnEvent('trip.status_changed')
  handleTripStatusChange(payload: any) {
    this.logger.log(
      `Broadcasting trip status change: ${payload.id} -> ${payload.status} for vehicle ${payload.vehicleId}`,
    );
    // Broadcast to admins
    this.server.to('admin').emit('trip:status-changed', payload);

    // Also emit as driver status change to satisfy existing frontend listeners if any
    this.server.to('admin').emit('driver:status-changed', {
      vehicleId: payload.vehicleId,
      driverId: payload.driverId,
      status: payload.status,
    });

    this.server.to(`trip:${payload.id}`).emit('trip:status-changed', payload);

    if (payload.status === 'cancelled' && payload.driverId) {
      this.logger.log(
        `Broadcasting trip:cancelled to driver:${payload.driverId} for trip ${payload.id}`,
      );
      this.server.to(`driver:${payload.driverId}`).emit('trip:cancelled', {
        tripId: payload.id,
        status: payload.status,
      });
    }
  }

  @OnEvent('order.verified')
  handleOrderVerified(payload: any) {
    this.logger.log(
      `Broadcasting order verification success to driver ${payload.driverId} for order ${payload.orderId}`,
    );
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized yet');
      return;
    }
    this.server
      .to(`driver:${payload.driverId}`)
      .emit('order:verified', payload);
    this.server.to('admin').emit('order:verified', payload);
  }

  @OnEvent('trip.assigned')
  handleTripAssigned(payload: any) {
    this.logger.log(
      `Broadcasting trip assignment: ${payload.id} to driver ${payload.driverId}`,
    );
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized yet');
      return;
    }
    // Notify the specific driver
    this.server.to(`driver:${payload.driverId}`).emit('trip:assigned', payload);
    // Also notify admins
    this.server.to('admin').emit('trip:assigned', payload);
  }

  @OnEvent('alert.resolved')
  handleAlertResolved(payload: any) {
    this.logger.log(`Broadcasting alert resolution: ${payload.id}`);
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized yet');
      return;
    }
    this.server.to('admin').emit('alert:resolved', payload);
  }

  @OnEvent('enroll.required')
  handleEnrollRequired(payload: any) {
    this.logger.log(
      `Broadcasting remote enroll request for driver ${payload.driverId} on device ${payload.deviceId}`,
    );
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized yet');
      return;
    }
    this.server
      .to(`driver:${payload.driverId}`)
      .emit('enroll:required', payload);
    this.server.to('admin').emit('enroll:required', payload);
  }

  @OnEvent('enroll.result')
  handleEnrollResult(payload: any) {
    this.logger.log(
      `Broadcasting remote enroll result for driver ${payload.driverId} on device ${payload.deviceId}: ${payload.success ? 'SUCCESS' : 'FAILED'}`,
    );
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized yet');
      return;
    }
    this.server.to(`driver:${payload.driverId}`).emit('enroll:result', payload);
    this.server.to('admin').emit('enroll:result', payload);
  }

  @OnEvent('fingerprint.deleted')
  handleFingerprintDeleted(payload: any) {
    this.logger.log(
      `Broadcasting remote delete result for driver ${payload.driverId} on device ${payload.deviceId}: ${payload.success ? 'SUCCESS' : 'FAILED'}`,
    );
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized yet');
      return;
    }
    this.server
      .to(`driver:${payload.driverId}`)
      .emit('fingerprint:deleted', payload);
    this.server.to('admin').emit('fingerprint:deleted', payload);
  }

  @OnEvent('fingerprint.all_cleared')
  handleFingerprintAllCleared(payload: any) {
    this.logger.log(
      `Broadcasting remote clear-all result for device ${payload.deviceId}: ${payload.success ? 'SUCCESS' : 'FAILED'}`,
    );
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized yet');
      return;
    }
    this.server.to('admin').emit('fingerprint:all_cleared', payload);
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(
          `Client connection rejected: No token provided. ID: ${client.id}, Handshake: ${JSON.stringify(client.handshake.headers)}`,
        );
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;

      // Join rooms based on role
      const userRole = payload.role?.toLowerCase();
      if (userRole === 'admin' || userRole === 'dispatcher') {
        client.join('admin');
        this.logger.log(
          `Admin/Dispatcher connected: ${client.id} (Role: ${payload.role})`,
        );
      } else if (userRole === 'driver') {
        const driver = await this.trackingService.getDriverByUserId(
          payload.sub,
        );
        if (driver) {
          client.join(`driver:${driver.id}`);
          client.data.driverId = driver.id; // Store driverId for convenience
          client.data.driverName = driver.user?.fullName || 'Driver'; // Store driverName for convenience
          this.logger.log(
            `Driver connected: ${client.id} (Driver ID: ${driver.id}, Name: ${client.data.driverName})`,
          );

          // Proactively trigger fingerprint enrollment if they are currently on an active trip and don't have a fingerprint
          this.trackingService
            .checkAndTriggerEnrollmentForActiveDriver(driver.id)
            .catch((err) => {
              this.logger.error(
                `[Biometric Connection Check] Failed to trigger enrollment: ${err.message}`,
              );
            });
        } else {
          this.logger.warn(
            `User ${payload.sub} has driver role but no driver profile found. Disconnecting.`,
          );
          client.disconnect();
          return;
        }
      }

      this.logger.log(`Client connected: ${client.id}`);
    } catch (error) {
      this.logger.warn(
        `Connection error for client ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sos:alert')
  async handleSosAlert(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      tripId: string;
      description?: string;
      location?: { latitude: number; longitude: number };
    },
  ) {
    const userId = client.data.user?.sub || client.data.user?.id;
    const driverId = client.data.driverId;
    const driverName = client.data.driverName || 'Driver';
    const { tripId, description, location } = data;

    this.logger.log(
      `Emergency SOS received from user ${userId} (Driver: ${driverName}) for trip ${tripId}`,
    );

    // Broadcast to all admins (who should be in the 'admin' room)
    this.server.to('admin').emit('alert:new', {
      type: 'SOS',
      severity: 'CRITICAL',
      message: `EMERGENCY: Driver ${driverName} triggered SOS!`,
      details: description || 'No description provided',
      tripId,
      driverId: driverId || userId,
      location: location || null,
      timestamp: Date.now(),
    });

    return { status: 'ok', message: 'SOS received and dispatch notified' };
  }

  @SubscribeMessage('gps:update')
  async handleGpsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GpsUpdateDto,
  ) {
    const user = client.data.user;

    // Authorization: Only drivers can update GPS (or admin for testing)
    if (user.role !== 'driver' && user.role !== 'admin') {
      return { event: 'error', data: 'Unauthorized to send GPS updates' };
    }

    // Ownership check for drivers
    if (user.role === 'driver') {
      const isAuthorized = await this.trackingService.validateDriverTrip(
        client.data.driverId,
        data.tripId,
        data.vehicleId,
      );
      if (!isAuthorized) {
        this.logger.warn(
          `Driver ${client.data.driverId} attempted unauthorized GPS update for trip ${data.tripId}`,
        );
        return { event: 'error', data: 'Unauthorized for this trip/vehicle' };
      }
    }

    try {
      const result = await this.trackingService.processGpsUpdate(data);

      // Broadcast to all admins
      this.server.to('admin').emit('gps:update', result);

      // Also broadcast to the specific trip room if implemented
      this.server.to(`trip:${data.tripId}`).emit('trip:location', result);

      return {
        event: 'gps:received',
        data: { timestamp: Date.now() },
      };
    } catch (error) {
      this.logger.error(`Error processing GPS update: ${error.message}`);
      return { event: 'error', data: error.message };
    }
  }

  @SubscribeMessage('gps:batch_update')
  async handleGpsBatchUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GpsUpdateDto[],
  ) {
    if (!data || data.length === 0) return { status: 'ok' };

    const user = client.data.user;
    if (user.role !== 'driver' && user.role !== 'admin') {
      return { event: 'error', data: 'Unauthorized' };
    }

    try {
      const results = await this.trackingService.processGpsBatch(data);

      // Broadcast the LATEST location to admins to keep dashboard snappy
      if (results.length > 0) {
        const latest: any = results[results.length - 1];
        this.server.to('admin').emit('gps:update', latest);
        this.server.to(`trip:${latest.tripId}`).emit('trip:location', latest);
      }

      return {
        event: 'gps:batch_received',
        data: { count: results.length, timestamp: Date.now() },
      };
    } catch (error) {
      this.logger.error(`Error processing batch GPS update: ${error.message}`);
      return { event: 'error', data: error.message };
    }
  }

  @SubscribeMessage('subscribe:trip')
  async handleSubscribeTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    if (!data.tripId) return { event: 'error', data: 'Trip ID required' };

    const user = client.data.user;

    // Admins/Dispatchers can subscribe to any trip
    if (user.role === 'admin' || user.role === 'dispatcher') {
      client.join(`trip:${data.tripId}`);
      return { event: 'subscribed', data: { room: `trip:${data.tripId}` } };
    }

    // Drivers can only subscribe to their own trips
    if (user.role === 'driver') {
      const driverId = client.data.driverId;
      const trip = await this.trackingService.getTripById(data.tripId);

      if (trip && trip.driverId === driverId) {
        client.join(`trip:${data.tripId}`);
        return { event: 'subscribed', data: { room: `trip:${data.tripId}` } };
      }
    }

    return { event: 'error', data: 'Unauthorized to subscribe to this trip' };
  }

  private extractToken(client: Socket): string | undefined {
    // 1. Try auth object (standard for Socket.io)
    const token = client.handshake.auth?.token;
    if (typeof token === 'string') {
      return token.startsWith('Bearer ') ? token.slice(7).trim() : token;
    }

    // 2. Try Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    // 3. Try Cookies (for Web Admin with HttpOnly cookies)
    if (client.handshake.headers.cookie) {
      try {
        const cookies = cookie.parse(client.handshake.headers.cookie);
        return cookies['access_token'];
      } catch (e) {
        this.logger.warn(
          `Error parsing cookies for client ${client.id}: ${e.message}`,
        );
      }
    }

    return undefined;
  }
}
