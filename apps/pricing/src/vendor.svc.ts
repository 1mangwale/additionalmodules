import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorPricingSlab } from './typeorm/vendor-pricing-slab.entity';

@Injectable()
export class VendorPricingService {
  constructor(@InjectRepository(VendorPricingSlab) private readonly repo: Repository<VendorPricingSlab>) {}

  async list(q: { vendorId?: number; storeId?: number }) {
    const where: any = {};
    if (q.vendorId) where.vendor_id = q.vendorId;
    if (q.storeId) where.store_id = q.storeId;
    const items = await this.repo.find({ where, order: { priority: 'ASC', id: 'ASC' }, take: 500 });
    return { items, total: items.length };
  }

  async create(body: Partial<VendorPricingSlab>) {
    const entity = this.repo.create({
      vendor_id: body.vendor_id!,
      store_id: body.store_id ?? null,
      zone_id: body.zone_id ?? null,
      module: (body.module as any) || 'service',
      name: body.name || 'Rule',
      basis: (body.basis as any) || 'weekday',
      method: (body.method as any) || 'flat',
      range_start: body.range_start ?? null,
      range_end: body.range_end ?? null,
      value: body.value ?? null,
      weekdays: body.weekdays ?? null,
      date_from: body.date_from ?? null,
      date_to: body.date_to ?? null,
      priority: typeof body.priority === 'number' ? body.priority : 100,
      active: body.active !== false,
      tag: (body.tag as any) || 'price',
    });
    const saved = await this.repo.save(entity);
    return saved;
  }

  async remove(id: number) {
    await this.repo.delete({ id });
    return { id, removed: true };
  }
}
