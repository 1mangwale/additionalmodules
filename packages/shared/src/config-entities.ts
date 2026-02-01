import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('store_working_hours')
export class StoreWorkingHours {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'bigint' })
    store_id!: number;

    @Column({ type: 'varchar', length: 50 })
    module_type!: string; // services, venues, movies, rooms

    @Column({ type: 'time' })
    start_time!: string;

    @Column({ type: 'time' })
    end_time!: string;

    @Column({ type: 'int', nullable: true })
    day_of_week!: number | null; // 0=Sunday, 6=Saturday, NULL=all days

    @Column({ type: 'boolean', default: true })
    is_active!: boolean;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at!: Date;
}

@Entity('store_breaks')
export class StoreBreaks {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'bigint' })
    store_id!: number;

    @Column({ type: 'varchar', length: 50 })
    module_type!: string;

    @Column({ type: 'time' })
    break_start_time!: string;

    @Column({ type: 'time' })
    break_end_time!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    break_name!: string | null;

    @Column({ type: 'int', nullable: true })
    day_of_week!: number | null;

    @Column({ type: 'boolean', default: true })
    is_active!: boolean;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;
}

@Entity('venue_peak_pricing')
export class VenuePeakPricing {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'bigint' })
    venue_type_id!: number;

    @Column({ type: 'bigint' })
    store_id!: number;

    @Column({ type: 'time' })
    peak_start_time!: string;

    @Column({ type: 'time' })
    peak_end_time!: string;

    @Column({ type: 'numeric', precision: 5, scale: 2, default: 1.5 })
    price_multiplier!: number;

    @Column({ type: 'int', nullable: true })
    day_of_week!: number | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    peak_name!: string | null;

    @Column({ type: 'boolean', default: true })
    is_active!: boolean;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updated_at!: Date;
}
