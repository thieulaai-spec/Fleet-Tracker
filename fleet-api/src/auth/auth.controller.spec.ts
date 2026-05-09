import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const mockRequest = {
    headers: {},
    cookies: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.DISPATCHER,
      };
      mockAuthService.register.mockResolvedValue({ id: '1', ...registerDto });

      const result = await controller.register(registerDto);

      expect(result).toBeDefined();
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login and set cookies', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const loginResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@example.com' },
      };
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto, mockResponse, mockRequest);

      expect(result).toEqual(loginResponse);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });

    it('should return only user for web clients', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const loginResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@example.com' },
      };
      mockAuthService.login.mockResolvedValue(loginResponse);
      const webRequest = {
        headers: { 'x-client-type': 'web' },
      } as unknown as Request;

      const result = await controller.login(loginDto, mockResponse, webRequest);

      expect(result).toEqual({ user: loginResponse.user });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens using body token', async () => {
      const refreshTokenDto = { refreshToken: 'old-token' };
      const refreshResponse = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        user: { id: '1' },
      };
      mockAuthService.refreshTokens.mockResolvedValue(refreshResponse);

      const result = await controller.refresh(
        refreshTokenDto,
        mockResponse,
        mockRequest,
      );

      expect(result).toEqual(refreshResponse);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });

    it('should refresh tokens using cookie token if body is missing', async () => {
      const refreshTokenDto = { refreshToken: '' };
      const reqWithCookie = {
        cookies: { refresh_token: 'cookie-token' },
        headers: {},
      } as unknown as Request;
      const refreshResponse = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        user: { id: '1' },
      };
      mockAuthService.refreshTokens.mockResolvedValue(refreshResponse);

      const result = await controller.refresh(
        refreshTokenDto,
        mockResponse,
        reqWithCookie,
      );

      expect(result).toEqual(refreshResponse);
      expect(authService.refreshTokens).toHaveBeenCalledWith('cookie-token');
    });

    it('should throw UnauthorizedException if refresh token is missing', async () => {
      const refreshTokenDto = { refreshToken: '' };
      const reqNoCookie = { cookies: {}, headers: {} } as unknown as Request;

      await expect(
        controller.refresh(refreshTokenDto, mockResponse, reqNoCookie),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout and clear cookies', async () => {
      const user = { id: '1' } as any;
      mockAuthService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await controller.logout(user, mockResponse);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.updateRefreshToken).toHaveBeenCalledWith('1', null);
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('getProfile', () => {
    it('should return the current user', () => {
      const user = { id: '1', email: 'test@example.com' } as any;
      const result = controller.getProfile(user);
      expect(result).toEqual(user);
    });
  });
});
