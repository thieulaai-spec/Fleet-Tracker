import { Test, TestingModule } from '@nestjs/testing';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

describe('TrackingGateway', () => {
  let gateway: TrackingGateway;
  let trackingService: TrackingService;
  let jwtService: JwtService;

  const mockTrackingService = {
    getDriverByUserId: jest.fn(),
    validateDriverTrip: jest.fn(),
    processGpsUpdate: jest.fn(),
    getTripById: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as unknown as Server;

  const mockSocket = {
    id: 'socket-id',
    handshake: {
      auth: {},
      headers: {},
    },
    join: jest.fn(),
    disconnect: jest.fn(),
    data: {},
  } as unknown as Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingGateway,
        {
          provide: TrackingService,
          useValue: mockTrackingService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    gateway = module.get<TrackingGateway>(TrackingGateway);
    trackingService = module.get<TrackingService>(TrackingService);
    jwtService = module.get<JwtService>(JwtService);
    gateway.server = mockServer;

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should disconnect if no token is provided', async () => {
      await gateway.handleConnection(mockSocket);
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should verify token and join admin room for admins', async () => {
      const socket = {
        ...mockSocket,
        handshake: { auth: { token: 'valid-token' }, headers: {} },
      } as any;
      mockJwtService.verify.mockReturnValue({ role: 'admin', sub: 'user-1' });

      await gateway.handleConnection(socket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(socket.join).toHaveBeenCalledWith('admin');
      expect(socket.data.user).toBeDefined();
    });

    it('should join driver room for drivers', async () => {
      const socket = {
        ...mockSocket,
        handshake: { auth: { token: 'valid-token' }, headers: {} },
      } as any;
      mockJwtService.verify.mockReturnValue({ role: 'driver', sub: 'user-1' });
      mockTrackingService.getDriverByUserId.mockResolvedValue({
        id: 'driver-1',
      });

      await gateway.handleConnection(socket);

      expect(socket.join).toHaveBeenCalledWith('driver:driver-1');
      expect(socket.data.driverId).toBe('driver-1');
    });

    it('should disconnect if driver profile is not found', async () => {
      const socket = {
        ...mockSocket,
        handshake: { auth: { token: 'valid-token' }, headers: {} },
      } as any;
      mockJwtService.verify.mockReturnValue({ role: 'driver', sub: 'user-1' });
      mockTrackingService.getDriverByUserId.mockResolvedValue(null);

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should extract token from authorization header', async () => {
      const socket = {
        ...mockSocket,
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
        },
      } as any;
      mockJwtService.verify.mockReturnValue({ role: 'admin', sub: 'user-1' });

      await gateway.handleConnection(socket);

      expect(jwtService.verify).toHaveBeenCalledWith('header-token');
    });

    it('should extract token from cookies', async () => {
      const socket = {
        ...mockSocket,
        handshake: {
          auth: {},
          headers: { cookie: 'access_token=cookie-token' },
        },
      } as any;
      mockJwtService.verify.mockReturnValue({ role: 'admin', sub: 'user-1' });

      await gateway.handleConnection(socket);

      expect(jwtService.verify).toHaveBeenCalledWith('cookie-token');
    });

    it('should handle invalid cookies gracefully', async () => {
      const socket = {
        ...mockSocket,
        handshake: { auth: {}, headers: { cookie: 'invalid' } },
      } as any;
      // Should fall through and disconnect if no token found
      await gateway.handleConnection(socket);
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should handle verification errors and disconnect', async () => {
      const socket = {
        ...mockSocket,
        handshake: { auth: { token: 'bad-token' }, headers: {} },
      } as any;
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection', () => {
      gateway.handleDisconnect(mockSocket);
      // Logger spy ensures no error
    });
  });

  describe('afterInit', () => {
    it('should log initialization', () => {
      gateway.afterInit(mockServer);
      // Logger spy ensures no error
    });
  });

  describe('handleGpsUpdate', () => {
    it('should allow admins to update GPS', async () => {
      const socket = {
        ...mockSocket,
        data: { user: { role: 'admin' } },
      } as any;
      const data = {
        tripId: 'trip-1',
        vehicleId: 'v-1',
        latitude: 1,
        longitude: 1,
      };
      mockTrackingService.processGpsUpdate.mockResolvedValue({ id: 'res-1' });

      const result = await gateway.handleGpsUpdate(socket, data as any);

      expect(result.event).toBe('gps:received');
      expect(trackingService.processGpsUpdate).toHaveBeenCalledWith(data);
    });

    it('should return error if unauthorized for trip', async () => {
      const socket = {
        ...mockSocket,
        data: { user: { role: 'driver' }, driverId: 'driver-1' },
      } as any;
      const data = {
        tripId: 'trip-1',
        vehicleId: 'v-1',
        latitude: 1,
        longitude: 1,
      };
      mockTrackingService.validateDriverTrip.mockResolvedValue(false);

      const result = await gateway.handleGpsUpdate(socket, data as any);

      expect(result.event).toBe('error');
      expect(result.data).toContain('Unauthorized');
    });

    it('should handle processing errors', async () => {
      const socket = {
        ...mockSocket,
        data: { user: { role: 'admin' } },
      } as any;
      const data = {
        tripId: 'trip-1',
        vehicleId: 'v-1',
        latitude: 1,
        longitude: 1,
      };
      mockTrackingService.processGpsUpdate.mockRejectedValue(
        new Error('DB Error'),
      );

      const result = await gateway.handleGpsUpdate(socket, data as any);

      expect(result.event).toBe('error');
      expect(result.data).toBe('DB Error');
    });

    it('should return numeric timestamp in gps:received event', async () => {
      const socket = {
        ...mockSocket,
        data: { user: { role: 'admin' } },
      } as any;
      const data = { tripId: 't1', vehicleId: 'v1', latitude: 1, longitude: 1 };
      mockTrackingService.processGpsUpdate.mockResolvedValue({});

      const result = await gateway.handleGpsUpdate(socket, data as any);

      expect(result.event).toBe('gps:received');
      expect(typeof result.data.timestamp).toBe('number');
      expect(result.data.timestamp).toBeGreaterThan(0);
    });
  });

  describe('handleSosAlert', () => {
    it('should broadcast SOS with numeric timestamp', async () => {
      const socket = {
        ...mockSocket,
        data: { user: { id: 'u1', fullName: 'Driver Name' } },
      } as any;
      const data = { tripId: 't1', description: 'Engine fire' };

      const result = await gateway.handleSosAlert(socket, data);

      expect(result.status).toBe('ok');
      expect(mockServer.to).toHaveBeenCalledWith('admin');
      expect(mockServer.emit).toHaveBeenCalledWith('alert:new', expect.objectContaining({
        type: 'SOS',
        tripId: 't1',
        timestamp: expect.any(Number),
      }));
    });
  });

  describe('handleSubscribeTrip', () => {
    it('should require tripId', async () => {
      const result = await gateway.handleSubscribeTrip(mockSocket, {} as any);
      expect(result.event).toBe('error');
    });

    it('should allow admin to subscribe', async () => {
      const socket = {
        ...mockSocket,
        data: { user: { role: 'admin' } },
      } as any;
      const result = await gateway.handleSubscribeTrip(socket, {
        tripId: 'trip-1',
      });
      expect(result.event).toBe('subscribed');
      expect(socket.join).toHaveBeenCalledWith('trip:trip-1');
    });

    it('should allow driver to subscribe to their own trip', async () => {
      const socket = {
        ...mockSocket,
        data: { user: { role: 'driver' }, driverId: 'driver-1' },
      } as any;
      mockTrackingService.getTripById.mockResolvedValue({
        driverId: 'driver-1',
      });

      const result = await gateway.handleSubscribeTrip(socket, {
        tripId: 'trip-1',
      });
      expect(result.event).toBe('subscribed');
    });

    it('should deny driver from subscribing to others trips', async () => {
      const socket = {
        ...mockSocket,
        data: { user: { role: 'driver' }, driverId: 'driver-1' },
      } as any;
      mockTrackingService.getTripById.mockResolvedValue({
        driverId: 'driver-2',
      });

      const result = await gateway.handleSubscribeTrip(socket, {
        tripId: 'trip-1',
      });
      expect(result.event).toBe('error');
    });
  });

  describe('Event Handlers', () => {
    it('handleNewAlert should broadcast to admin and driver', () => {
      const payload = { type: 'SPEEDING', driverId: 'driver-1' };
      gateway.handleNewAlert(payload);

      expect(mockServer.to).toHaveBeenCalledWith('admin');
      expect(mockServer.to).toHaveBeenCalledWith('driver:driver-1');
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });

    it('handleTripStatusChange should broadcast to admin and trip room', () => {
      const payload = { id: 'trip-1', status: 'COMPLETED' };
      gateway.handleTripStatusChange(payload);

      expect(mockServer.to).toHaveBeenCalledWith('admin');
      expect(mockServer.to).toHaveBeenCalledWith('trip:trip-1');
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });

    it('handleAlertResolved should broadcast to admin', () => {
      const payload = { id: 'alert-1' };
      gateway.handleAlertResolved(payload);

      expect(mockServer.to).toHaveBeenCalledWith('admin');
      expect(mockServer.emit).toHaveBeenCalledWith('alert:resolved', payload);
    });
  });
});
