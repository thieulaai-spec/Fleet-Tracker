import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-secret');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should throw error if JWT_SECRET is missing during instantiation', () => {
    mockConfigService.get.mockReturnValue(null);
    expect(() => {
      new JwtStrategy(mockConfigService as any, mockAuthService as any);
    }).toThrow('JWT_SECRET is not defined in the configuration');
  });

  describe('validate', () => {
    it('should return user if validation succeeds', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      const user = { id: '1', email: 'test@example.com' };
      mockAuthService.validateUser.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(result).toEqual(user);
      expect(authService.validateUser).toHaveBeenCalledWith(payload);
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
