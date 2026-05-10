import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum OrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pickup_address' })
  pickupAddress: string;

  @Column({
    name: 'pickup_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  pickupLocation: any;

  @Column({ name: 'delivery_address' })
  deliveryAddress: string;

  @Column({
    name: 'delivery_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  deliveryLocation: any;

  @Column({ name: 'weight_kg', type: 'decimal' })
  weightKg: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index()
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string;

  @Column({ name: 'signature_url', type: 'text', nullable: true })
  signatureUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
