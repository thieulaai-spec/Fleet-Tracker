import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DriverKpi } from './driver-kpi.entity';

export enum DriverStatus {
  AVAILABLE = 'available',
  ON_TRIP = 'on_trip',
  OFF_DUTY = 'off_duty',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.driver, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => DriverKpi, (kpi) => kpi.driver)
  kpi: DriverKpi;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'license_class', nullable: true })
  licenseClass: string;

  @Column({ name: 'license_expiry', type: 'date', nullable: true })
  licenseExpiry: Date;

  @Column({
    name: 'fingerprint_id',
    type: 'varchar',
    nullable: true,
    unique: true,
  })
  fingerprintId: string | null;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.AVAILABLE,
  })
  status: DriverStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
