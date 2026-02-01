import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'venue_types' })
export class VenueType {
    @PrimaryGeneratedColumn('increment') id!: number;
    @Column({ type: 'bigint' }) store_id!: number;
    @Column({ type: 'text' }) name!: string;
    @Column({ type: 'varchar', length: 50 }) venue_category!: string; // cricket_turf, badminton_court, tennis_court, etc
    @Column({ type: 'bigint' }) hourly_rate_minor!: number;
    @Column({ type: 'text', nullable: true }) description!: string | null;
    @Column({ type: 'text', nullable: true }) facilities!: string | null; // Changing rooms, parking, etc
    @Column({ type: 'smallint', default: 1 }) status!: number;
    @Column({ type: 'int', default: 60 }) session_duration_min!: number;
    @Column({ type: 'int', default: 15 }) buffer_time_min!: number;
}

@Entity({ name: 'venue_slots' })
export class VenueSlot {
    @PrimaryGeneratedColumn('increment') id!: number;
    @Column({ type: 'bigint' }) venue_type_id!: number;
    @Column({ type: 'bigint' }) store_id!: number;
    @Column({ type: 'date' }) date!: string;
    @Column({ type: 'int' }) hour_start!: number; // 0-23
    @Column({ type: 'int' }) hour_end!: number; // 1-24
    @Column({ type: 'int', default: 1 }) capacity!: number; // Usually 1 for exclusive booking
    @Column({ type: 'int', default: 0 }) booked!: number;
    @Column({ type: 'varchar', length: 20, default: 'open' }) status!: string;
    @Column({ type: 'bigint', nullable: true }) price_override_minor!: number | null;
}

@Entity({ name: 'venue_bookings' })
export class VenueBooking {
    @PrimaryGeneratedColumn('uuid') id!: string;
    @Column({ type: 'bigint' }) user_id!: number;
    @Column({ type: 'bigint' }) store_id!: number;
    @Column({ type: 'bigint' }) venue_type_id!: number;
    @Column({ type: 'bigint' }) slot_id!: number;
    @Column({ type: 'date' }) booking_date!: string;
    @Column({ type: 'int' }) hours!: number;
    @Column({ type: 'bigint' }) amount_minor!: number;
    @Column({ type: 'varchar', length: 20, default: 'confirmed' }) status!: string;
    @Column({ type: 'varchar', length: 20, nullable: true }) payment_mode!: string | null;
    @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;

    @ManyToOne(() => VenueType)
    @JoinColumn({ name: 'venue_type_id' })
    venueType?: VenueType;

    @ManyToOne(() => VenueSlot)
    @JoinColumn({ name: 'slot_id' })
    slot?: VenueSlot;
}
