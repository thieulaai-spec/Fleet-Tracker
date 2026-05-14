import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password, role } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      email,
      passwordHash,
      role,
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.passwordHash;
    return savedUser;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      select: ['id', 'email', 'passwordHash', 'role'],
    });

    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(password, user.passwordHash))
    ) {
      const tokens = await this.getTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        select: ['id', 'email', 'role', 'refreshTokenHash'],
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Access Denied');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshTokenHash,
      );
      if (!refreshTokenMatches)
        throw new UnauthorizedException('Access Denied');

      const tokens = await this.getTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    if (!refreshToken) {
      await this.userRepository.update(userId, {
        refreshTokenHash: null,
      });
      return;
    }
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(refreshToken, salt);
    await this.userRepository.update(userId, {
      refreshTokenHash: hash,
    });
  }

  async getTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn:
          (this.configService.get<string>('JWT_ACCESS_EXPIRY') as any) || '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn:
          (this.configService.get<string>('JWT_REFRESH_EXPIRY') as any) || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(payload: any): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'passwordHash'],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new UnauthorizedException('New password must be different from old password');
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.userRepository.update(userId, {
      passwordHash,
      refreshTokenHash: null, // Invalidate existing tokens
    });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string; resetCode: string }> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email not found');
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 15 minutes from now
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 15);

    // Store reset code in user (hashed)
    const salt = await bcrypt.genSalt();
    const resetCodeHash = await bcrypt.hash(resetCode, salt);

    await this.userRepository.update(user.id, {
      resetCode: resetCodeHash,
      resetCodeExpiry: expiryTime,
    });

    // In production, send via email. For now, return it for demo
    console.log(`[PASSWORD RESET] Email: ${email}, Code: ${resetCode}, Expires: ${expiryTime}`);

    return {
      message: 'Reset code sent to email (check console for demo)',
      resetCode, // Remove in production - only for demo
    };
  }

  async resetPassword(
    email: string,
    resetCode: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find user by email with reset code info
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      select: ['id', 'resetCode', 'resetCodeExpiry', 'passwordHash'],
    });

    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      throw new UnauthorizedException('Invalid reset code or user not found');
    }

    // Check if reset code has expired
    if (new Date() > user.resetCodeExpiry) {
      throw new UnauthorizedException('Reset code has expired');
    }

    // Verify reset code
    const isCodeValid = await bcrypt.compare(resetCode, user.resetCode);
    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid reset code');
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset code
    await this.userRepository.update(user.id, {
      passwordHash,
      resetCode: null,
      resetCodeExpiry: null,
      refreshTokenHash: null, // Invalidate existing tokens
    });

    return { message: 'Password reset successfully' };
  }
}
