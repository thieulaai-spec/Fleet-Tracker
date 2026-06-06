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

export enum OrderCategory {
  RAW_MATERIAL = 'raw_material',
  FINISHED_GOODS = 'finished_goods',
  COMPONENT = 'component',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
}

export enum OrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
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

  @Column({
    name: 'pickup_actual_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  pickupActualLocation: any;

  @Column({
    name: 'delivery_actual_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  deliveryActualLocation: any;

  @Column({ name: 'recipient_name', type: 'varchar', nullable: true })
  recipientName: string;

  @Column({ name: 'recipient_phone', type: 'varchar', nullable: true })
  recipientPhone: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'other',
  })
  category: OrderCategory;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'medium',
  })
  priority: OrderPriority;

  @Column({ name: 'delivery_deadline', type: 'timestamptz', nullable: true })
  deliveryDeadline: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
