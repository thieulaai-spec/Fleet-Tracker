import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { UserRole } from '../../entities/user.entity';

describe('Roles decorator', () => {
  it('should set metadata with single role', () => {
    @Roles(UserRole.ADMIN)
    class TestClass {}
    const reflector = new Reflector();
    const roles = reflector.get<UserRole[]>('roles', TestClass);
    expect(roles).toEqual([UserRole.ADMIN]);
  });

  it('should set metadata with multiple roles', () => {
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
    class TestClass {}
    const reflector = new Reflector();
    const roles = reflector.get<UserRole[]>('roles', TestClass);
    expect(roles).toEqual([UserRole.ADMIN, UserRole.DISPATCHER]);
  });

  it('should set empty roles array', () => {
    @Roles()
    class TestClass {}
    const reflector = new Reflector();
    const roles = reflector.get<UserRole[]>('roles', TestClass);
    expect(roles).toEqual([]);
  });
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GetUser } = require('./current-user.decorator');

describe('GetUser decorator', () => {
  it('should be defined', () => {
    expect(GetUser).toBeDefined();
  });
});
