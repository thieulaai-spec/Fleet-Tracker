import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if no roles are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);
    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });

  it('should return true if user has required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: { role: UserRole.ADMIN },
    });
    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });

  it('should return false if user does not have required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: { role: UserRole.DISPATCHER },
    });
    expect(guard.canActivate(mockExecutionContext)).toBe(false);
  });

  it('should return false if no user is present', () => {
    mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: null,
    });
    expect(guard.canActivate(mockExecutionContext)).toBe(false);
  });
});
