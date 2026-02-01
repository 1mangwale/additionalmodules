import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'room_types' })
export class RoomType {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'text' }) name!: string;
  @Column({ type: 'int', default: 2 }) occupancy_adults!: number;
  @Column({ type: 'int', default: 0 }) occupancy_children!: number;
  @Column({ type: 'jsonb', nullable: true }) amenities!: any | null;
  @Column({ type: 'smallint', default: 1 }) status!: number;

  // Categorization fields
  @Column({ type: 'text', default: 'hotel' }) accommodation_type!: string; // hotel|hostel|villa|apartment|farmhouse|guesthouse|beachhouse
  @Column({ type: 'text', default: 'standard' }) category!: string; // standard|deluxe|suite|dorm-bed|entire-property
  @Column({ type: 'text', default: 'mixed' }) gender_policy!: string; // mixed|male|female
  @Column({ type: 'int', nullable: true }) beds_per_room!: number | null;
  @Column({ type: 'time', nullable: true }) checkin_time!: string | null;
  @Column({ type: 'time', nullable: true }) checkout_time!: string | null;
  @Column({ type: 'int', default: 3 }) buffer_hours!: number;
}

@Entity({ name: 'room_rate_plans' })
export class RoomRatePlan {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'bigint' }) room_type_id!: number;
  @Column({ type: 'text' }) name!: string;
  @Column({ type: 'boolean', default: true }) refundable!: boolean;
  @Column({ type: 'jsonb', nullable: true }) refund_policy!: any | null;
  @Column({ type: 'text', default: 'flat' }) pricing_mode!: string;
}

@Entity({ name: 'room_inventory' })
export class RoomInventory {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'bigint' }) room_type_id!: number;
  @Column({ type: 'date' }) date!: string;
  @Column({ type: 'int' }) total_rooms!: number;
  @Column({ type: 'int', default: 0 }) sold_rooms!: number;
  @Column({ type: 'time', nullable: true }) cutoff_time!: string | null;
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true }) price_override!: string | null;
  @Column({ type: 'text', default: 'open' }) status!: string;
}

@Entity({ name: 'room_bookings' })
export class RoomBooking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'bigint' }) user_id!: number;
  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'date' }) check_in!: string;
  @Column({ type: 'date' }) check_out!: string;
  @Column({ type: 'int', default: 1 }) rooms!: number;
  @Column({ type: 'int', default: 1 }) adults!: number;
  @Column({ type: 'int', default: 0 }) children!: number;
  @Column({ type: 'text', default: 'pending' }) status!: string; // pending|confirmed|checked-in|checked-out|cancelled|no-show
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }) created_at!: Date;

  @OneToMany(() => RoomBookingItem, item => item.booking)
  items!: RoomBookingItem[];
}

@Entity({ name: 'room_booking_items' })
export class RoomBookingItem {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'uuid' }) booking_id!: string;
  @Column({ type: 'bigint' }) room_type_id!: number;
  @Column({ type: 'bigint' }) rate_plan_id!: number;
  @Column({ type: 'int' }) nights!: number;
  @Column({ type: 'numeric', precision: 12, scale: 2 }) price_per_night!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) tax_amount!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2 }) total!: string;

  @ManyToOne(() => RoomBooking, booking => booking.items)
  @JoinColumn({ name: 'booking_id' })
  booking!: RoomBooking;

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType!: RoomType;
}
