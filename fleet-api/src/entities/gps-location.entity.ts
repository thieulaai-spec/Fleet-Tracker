import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { Trip } from './trip.entity';

@Entity('gps_locations')
@Index(['vehicleId', 'recordedAt'])
export class GpsLocation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Trip, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'trip_id', nullable: true })
  tripId: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: any;

  @Column({ name: 'speed_kmh', type: 'decimal', nullable: true })
  speedKmh: number;

  @Column({ type: 'decimal', nullable: true })
  heading: number;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;
}
