import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Driver } from './driver.entity';

export enum UserRole {
  ADMIN = 'admin',
  DRIVER = 'driver',
  DISPATCHER = 'dispatcher',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.DRIVER,
  })
  role: UserRole;

  @Column({
    type: 'text',
    name: 'refresh_token_hash',
    nullable: true,
    select: false,
  })
  refreshTokenHash?: string | null;

  @Column({
    name: 'reset_code',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  resetCode?: string | null;

  @Column({
    name: 'reset_code_expiry',
    type: 'timestamp',
    nullable: true,
    select: false,
  })
  resetCodeExpiry?: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @OneToOne(() => Driver, (driver) => driver.user)
  driver: Driver;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
