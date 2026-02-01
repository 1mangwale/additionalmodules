import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'services_catalog' })
export class ServiceCatalog {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'text' }) name!: string;
  @Column({ type: 'text', nullable: true }) category!: string | null; // plumbing|electrical|carpentry|painting|cleaning|ac-repair|gardening|salon|spa|tutoring
  @Column({ type: 'text', nullable: true }) parent_category!: string | null; // home-repair|home-maintenance|wellness|education|professional
  @Column({ type: 'text', default: 'dynamic' }) pricing_model!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) base_price!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) visit_fee!: string;
  @Column({ type: 'boolean', default: true }) at_customer_location!: boolean;
  @Column({ type: 'smallint', default: 1 }) status!: number;
  @Column({ type: 'int', nullable: true }) duration_min!: number | null;
  @Column({ type: 'int', default: 15 }) buffer_time_min!: number;
}

@Entity({ name: 'service_slots' })
export class ServiceSlot {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'date' }) date!: string;
  @Column({ type: 'time', name: 'start_time' }) start_time!: string;
  @Column({ type: 'time', name: 'end_time' }) end_time!: string;
  @Column({ type: 'int', default: 1 }) capacity!: number;
  @Column({ type: 'int', default: 0 }) booked!: number;
}

@Entity({ name: 'vendor_stores' })
export class VendorStore {
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @Column({ type: 'bigint' }) vendor_id!: number;
  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'text', nullable: true }) name!: string | null;
  @Column({ type: 'double precision', nullable: true }) lat!: number | null;
  @Column({ type: 'double precision', nullable: true }) lng!: number | null;
  @Column({ type: 'numeric', precision: 8, scale: 2, default: 15.0 }) service_radius_km!: string;
}

@Entity({ name: 'service_appointments' })
export class ServiceAppointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'bigint' }) user_id!: number;
  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'bigint' }) service_id!: number;
  @Column({ type: 'bigint', nullable: true }) slot_id!: number | null;
  @Column({ type: 'timestamptz' }) scheduled_for!: Date;
  @Column({ type: 'bigint', nullable: true }) address_id!: number | null;
  @Column({ type: 'text', default: 'pending' }) status!: string; // pending|confirmed|assigned|en-route|in-progress|completed|cancelled
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) base_amount!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) visit_fee!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) tax_amount!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true }) final_amount!: string | null;
  @Column({ type: 'text', default: 'prepaid' }) payment_mode!: string; // prepaid|deposit|postpaid
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }) created_at!: Date;
  @Column({ type: 'timestamptz', nullable: true }) completed_at!: Date | null;

  @ManyToOne(() => ServiceCatalog)
  @JoinColumn({ name: 'service_id' })
  service!: ServiceCatalog;

  @ManyToOne(() => ServiceSlot)
  @JoinColumn({ name: 'slot_id' })
  slot!: ServiceSlot;
}
