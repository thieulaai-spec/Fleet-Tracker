import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole } from '../entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.DRIVER,
    isActive: true,
    refreshTokenHash: 'hashed-refresh-token',
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_ACCESS_EXPIRY') return '1h';
      if (key === 'JWT_REFRESH_EXPIRY') return '7d';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Password123',
      role: UserRole.DRIVER,
    };

    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ ...registerDto, passwordHash: 'hashed' });
      mockUserRepository.save.mockResolvedValue({ ...registerDto, id: 'new-id' });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(registerDto.email);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'correct-password',
    };

    it('should return tokens on valid credentials', async () => {
      const bcryptCompareSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockUser.email);
      bcryptCompareSpy.mockRestore();
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const bcryptCompareSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      bcryptCompareSpy.mockRestore();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    const refreshToken = 'valid-refresh-token';

    it('should return new tokens on valid refresh token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const bcryptCompareSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refreshTokens(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result.user.id).toBe(mockUser.id);
      bcryptCompareSpy.mockRestore();
    });

    it('should throw UnauthorizedException if hash mismatch', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const bcryptCompareSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
      bcryptCompareSpy.mockRestore();
    });

    it('should throw UnauthorizedException on verification failure', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error());

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateRefreshToken', () => {
    it('should hash and save refresh token', async () => {
      const bcryptHashSpy = jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('new-hash'));
      
      await service.updateRefreshToken(mockUser.id, 'new-token');

      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        refreshTokenHash: 'new-hash',
      });
      bcryptHashSpy.mockRestore();
    });

    it('should set hash to null if token is null', async () => {
      await service.updateRefreshToken(mockUser.id, null);

      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        refreshTokenHash: null,
      });
    });
  });

  describe('getTokens', () => {
    it('should return access and refresh tokens', async () => {
      mockJwtService.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');

      const result = await service.getTokens(mockUser.id, mockUser.email, mockUser.role);

      expect(result).toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
    });
  });

  describe('validateUser', () => {
    it('should return user if found and active', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser({ sub: mockUser.id });

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser({ sub: 'none' });

      expect(result).toBeNull();
    });
  });
});
