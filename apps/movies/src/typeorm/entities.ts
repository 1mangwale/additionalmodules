import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'movies' })
export class Movie {
  @PrimaryGeneratedColumn('increment') id!: number;
  @Column({ type: 'bigint' }) store_id!: number; // vendor
  @Column({ type: 'text' }) title!: string;
  @Column({ type: 'text', nullable: true }) genre!: string | null;
  @Column({ type: 'int', default: 120 }) duration_min!: number;
  @Column({ type: 'smallint', default: 1 }) status!: number;
  @Column({ type: 'int', default: 20 }) buffer_time_min!: number;
}

@Entity({ name: 'screens' })
export class Screen {
  @PrimaryGeneratedColumn('increment') id!: number;
  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'text' }) name!: string;
  @Column({ type: 'int', default: 100 }) seat_count!: number;
  @Column({ type: 'jsonb', nullable: true }) layout_config!: any;
  @Column({ type: 'int', default: 0 }) total_capacity!: number;
  @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @CreateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}

@Entity({ name: 'screen_sections' })
export class ScreenSection {
  @PrimaryGeneratedColumn('increment') id!: number;
  @Column({ type: 'bigint' }) screen_id!: number;
  @Column({ type: 'varchar', length: 50 }) section_id!: string;
  @Column({ type: 'text' }) name!: string;
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1.0 }) price_multiplier!: string;
  @Column({ type: 'varchar', length: 5, nullable: true }) row_start!: string | null;
  @Column({ type: 'varchar', length: 5, nullable: true }) row_end!: string | null;
  @Column({ type: 'varchar', length: 20, default: 'standard' }) seat_type!: string;
  @Column({ type: 'varchar', length: 7, default: '#90EE90' }) color!: string;
  @Column({ type: 'int', default: 0 }) display_order!: number;
  @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}

@Entity({ name: 'screen_seats' })
export class ScreenSeat {
  @PrimaryGeneratedColumn('increment') id!: number;
  @Column({ type: 'bigint' }) screen_id!: number;
  @Column({ type: 'varchar', length: 50 }) section_id!: string;
  @Column({ type: 'varchar', length: 5 }) row_label!: string;
  @Column({ type: 'int' }) seat_number!: number;
  @Column({ type: 'varchar', length: 10 }) seat_label!: string;
  @Column({ type: 'varchar', length: 20, default: 'standard' }) seat_type!: string;
  @Column({ type: 'boolean', default: false }) is_blocked!: boolean;
  @Column({ type: 'text', nullable: true }) block_reason!: string | null;
  @Column({ type: 'int', default: 0 }) position_x!: number;
  @Column({ type: 'int', default: 0 }) position_y!: number;
  @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}

@Entity({ name: 'showtime_seats' })
export class ShowtimeSeat {
  @PrimaryGeneratedColumn('increment') id!: number;
  @Column({ type: 'bigint' }) showtime_id!: number;
  @Column({ type: 'bigint' }) seat_id!: number;
  @Column({ type: 'varchar', length: 20, default: 'available' }) status!: string;
  @Column({ type: 'uuid', nullable: true }) booking_id!: string | null;
  @Column({ type: 'bigint', nullable: true }) reserved_by!: number | null;
  @Column({ type: 'timestamptz', nullable: true }) reserved_at!: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) reserved_until!: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) booked_at!: Date | null;
}

@Entity({ name: 'showtime_pricing' })
export class ShowtimePricing {
  @PrimaryGeneratedColumn('increment') id!: number;
  @Column({ type: 'bigint' }) showtime_id!: number;
  @Column({ type: 'varchar', length: 50 }) section_id!: string;
  @Column({ type: 'bigint' }) price_minor!: number;
  @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}

@Entity({ name: 'showtimes' })
export class Showtime {
  @PrimaryGeneratedColumn('increment') id!: number;
  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'bigint' }) movie_id!: number;
  @Column({ type: 'bigint' }) screen_id!: number;
  @Column({ type: 'timestamp' }) starts_at!: Date;
  @Column({ type: 'int', default: 0 }) booked!: number;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) base_price!: string;
}

@Entity({ name: 'movie_bookings' })
export class MovieBooking {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'bigint' }) user_id!: number;
  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'bigint' }) showtime_id!: number;
  @Column({ type: 'int' }) seats!: number;
  @Column({ type: 'jsonb', nullable: true }) seat_numbers!: string[]; // Array of seat identifiers
  @Column({ type: 'bigint' }) amount_minor!: number;
  @Column({ type: 'varchar', length: 20, default: 'confirmed' }) status!: string;
  @CreateDateColumn({ type: 'timestamptz' }) booked_at!: Date;

  @ManyToOne(() => Showtime)
  @JoinColumn({ name: 'showtime_id' })
  showtime?: Showtime;
}
