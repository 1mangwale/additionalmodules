import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'restaurants' })
export class Restaurant {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'varchar', length: 255 }) name!: string;
  @Column({ type: 'text', nullable: true }) description!: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) cuisine_type!: string; // Italian, Chinese, Indian, etc.
  @Column({ type: 'int', default: 0 }) total_tables!: number;
  @Column({ type: 'int', default: 0 }) total_capacity!: number;
  @Column({ type: 'varchar', length: 20, default: 'active' }) status!: string; // active|inactive
  @Column({ type: 'jsonb', nullable: true }) metadata!: any; // opening hours, etc.
  @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;

  @OneToMany(() => TableType, table => table.restaurant)
  tables!: TableType[];
}

@Entity({ name: 'table_types' })
export class TableType {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'bigint' }) restaurant_id!: number;
  @Column({ type: 'varchar', length: 100 }) table_number!: string; // T1, T2, VIP-1, etc.
  @Column({ type: 'int' }) capacity!: number; // seats
  @Column({ type: 'varchar', length: 50, nullable: true }) location!: string; // window, patio, indoor, etc.
  @Column({ type: 'varchar', length: 50, default: 'standard' }) table_type!: string; // standard, vip, private
  @Column({ type: 'varchar', length: 20, default: 'available' }) status!: string; // available|occupied|reserved|maintenance
  @Column({ type: 'jsonb', nullable: true }) metadata!: any; // special features
  @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;

  @ManyToOne(() => Restaurant, restaurant => restaurant.tables)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @OneToMany(() => TableBooking, booking => booking.tableType)
  bookings!: TableBooking[];
}

@Entity({ name: 'table_bookings' })
export class TableBooking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'bigint' }) user_id!: number;
  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'bigint' }) restaurant_id!: number;
  @Column({ type: 'bigint' }) table_type_id!: number;
  @Column({ type: 'date' }) booking_date!: string; // YYYY-MM-DD
  @Column({ type: 'time' }) booking_time!: string; // HH:MM:SS
  @Column({ type: 'int' }) party_size!: number; // number of guests
  @Column({ type: 'int', default: 120 }) duration_minutes!: number; // typical dining duration
  @Column({ type: 'varchar', length: 255, nullable: true }) customer_name!: string;
  @Column({ type: 'varchar', length: 20, nullable: true }) customer_phone!: string;
  @Column({ type: 'text', nullable: true }) special_requests!: string; // birthday, anniversary, dietary restrictions
  @Column({ type: 'bigint', default: 0 }) amount_minor!: number; // booking fee or deposit
  @Column({ type: 'varchar', length: 20, default: 'pending' }) status!: string; // pending|confirmed|seated|completed|cancelled|no-show
  @Column({ type: 'varchar', length: 20, nullable: true }) payment_mode!: string; // prepaid, at-venue
  @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;

  @ManyToOne(() => TableType, table => table.bookings)
  @JoinColumn({ name: 'table_type_id' })
  tableType!: TableType;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;
}
