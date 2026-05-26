import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum VerificationStep {
  ACCEPT = 'accept',
  PICKUP = 'pickup',
  CHECKPOINT = 'checkpoint',
  DELIVERY = 'delivery',
}

@Entity('order_verifications')
export class OrderVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({
    type: 'enum',
    enum: VerificationStep,
  })
  step: VerificationStep;

  @Column({ name: 'fingerprint_status', type: 'boolean', default: false })
  fingerprintStatus: boolean;

  @Column({ name: 'face_photo_url', type: 'text', nullable: true })
  facePhotoUrl: string;

  @Column({ name: 'cargo_photo_url', type: 'text', nullable: true })
  cargoPhotoUrl: string;

  @Column({
    name: 'location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
