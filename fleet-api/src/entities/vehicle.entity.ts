import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Driver } from './driver.entity';

export enum VehicleType {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  DELIVERING = 'delivering',
  MAINTENANCE = 'maintenance',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plate_number', unique: true })
  plateNumber: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
  })
  type: VehicleType;

  @Column({ name: 'max_capacity_kg', type: 'decimal' })
  maxCapacityKg: number;

  @Column({ name: 'current_load_kg', type: 'decimal', default: 0 })
  currentLoadKg: number;

  @ManyToOne(() => Driver, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver | null;

  @Column({ name: 'driver_id', nullable: true })
  driverId: string | null;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  model: string | null;

  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Index()
  @Column({ name: 'device_id', type: 'varchar', nullable: true, unique: true })
  deviceId: string | null;

  @Column({
    name: 'last_known_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  lastKnownLocation: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  kmThisMonth?: number;
  condition?: string;
}
