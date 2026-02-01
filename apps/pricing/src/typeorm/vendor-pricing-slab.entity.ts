import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'vendor_pricing_slabs' })
export class VendorPricingSlab {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'bigint' })
  vendor_id!: number;

  @Column({ type: 'bigint', nullable: true })
  store_id!: number | null;

  @Column({ type: 'bigint', nullable: true })
  zone_id!: number | null;

  @Column({ type: 'text' })
  module!: 'room' | 'service';

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  basis!: 'date_range' | 'weekday' | 'hour' | 'lead_time' | 'distance_km' | 'occupancy';

  @Column({ type: 'text' })
  method!: 'flat' | 'percent' | 'per_unit';

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: true })
  range_start!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: true })
  range_end!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: true })
  value!: string | null;

  @Column({ type: 'int', array: true, nullable: true })
  weekdays!: number[] | null;

  @Column({ type: 'date', nullable: true })
  date_from!: string | null;

  @Column({ type: 'date', nullable: true })
  date_to!: string | null;

  @Column({ type: 'int', default: 100 })
  priority!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'text', default: 'price' })
  tag!: 'price' | 'visit_fee' | 'refund_penalty' | 'commission';
}
