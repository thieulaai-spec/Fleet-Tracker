import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Driver } from './driver.entity';

@Entity('driver_kpi')
export class DriverKpi {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Driver, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ name: 'driver_id', unique: true })
  driverId: string;

  @Column({ name: 'total_trips', default: 0 })
  totalTrips: number;

  @Column({ name: 'completed_trips', default: 0 })
  completedTrips: number;

  @Column({ name: 'completion_rate', type: 'decimal', default: 0 })
  completionRate: number;

  @Column({ name: 'total_violations', default: 0 })
  totalViolations: number;

  @Column({ name: 'speed_violations', default: 0 })
  speedViolations: number;

  @Column({ name: 'route_violations', default: 0 })
  routeViolations: number;

  @Column({ name: 'abnormal_stops', default: 0 })
  abnormalStops: number;

  @Column({ name: 'incidents', default: 0 })
  incidents: number;

  @Column({ name: 'kpi_score', type: 'decimal', default: 100 })
  kpiScore: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
