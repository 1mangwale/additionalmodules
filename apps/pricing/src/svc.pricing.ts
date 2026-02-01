import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorPricingSlab } from './typeorm/vendor-pricing-slab.entity';
import { PricingQuoteRequest, PricingQuoteResponse, PriceLine } from '@mangwale/shared';

function addLine(lines: PriceLine[], tag: PriceLine['tag'], amt: number, description?: string) {
  if (amt === 0) return;
  lines.push({ tag, amount_minor: Math.round(amt), description });
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(VendorPricingSlab) private readonly repo: Repository<VendorPricingSlab>,
  ) {}

  async quote(req: PricingQuoteRequest): Promise<PricingQuoteResponse> {
    const slabs = await this.repo.find({
      where: { module: req.module as any, active: true },
      order: { priority: 'ASC', id: 'ASC' },
    });

    const lines: PriceLine[] = [];
    let total = 0;

    // Base price – you may fetch from catalog/room types; for starter we use 0 baseline.
    let baseMinor = 0;

    // Evaluate slabs (basic matching logic)
    for (const s of slabs) {
      const basis = s.basis;
      const tag = s.tag;
      const method = s.method;

      // Compute context values
      const inputs = req.inputs || {};
      const checkIn = inputs.checkIn ? new Date(inputs.checkIn) : undefined;
      const hour = typeof inputs.hour === 'number' ? inputs.hour : (inputs.startTime ? Number(String(inputs.startTime).slice(0,2)) : undefined);
      const lead = typeof inputs.leadTimeHours === 'number' ? inputs.leadTimeHours : undefined;
      const dist = typeof inputs.distanceKm === 'number' ? inputs.distanceKm : undefined;
      const occ = typeof inputs.nights === 'number' ? inputs.nights : undefined; // placeholder for occupancy

      let matches = true;
      if (basis === 'weekday') {
        if (!checkIn || !s.weekdays || s.weekdays.length === 0) matches = false;
        else {
          const wd = checkIn.getUTCDay(); // 0-6
          matches = s.weekdays.includes(wd);
        }
      } else if (basis === 'hour') {
        if (typeof hour !== 'number') matches = false;
        else {
          const start = s.range_start != null ? Number(s.range_start) : 0;
          const end = s.range_end != null ? Number(s.range_end) : 24;
          matches = hour >= start && hour < end;
        }
      } else if (basis === 'lead_time') {
        if (typeof lead !== 'number') matches = false;
        else {
          const start = s.range_start != null ? Number(s.range_start) : 0;
          const end = s.range_end != null ? Number(s.range_end) : 1e9;
          matches = lead >= start && lead < end;
        }
      } else if (basis === 'distance_km') {
        if (typeof dist !== 'number') matches = false;
        else {
          const start = s.range_start != null ? Number(s.range_start) : 0;
          const end = s.range_end != null ? Number(s.range_end) : 1e9;
          matches = dist >= start && dist < end;
        }
      } else if (basis === 'date_range') {
        if (!checkIn || !s.date_from || !s.date_to) matches = false;
        else {
          const d0 = new Date(s.date_from);
          const d1 = new Date(s.date_to);
          matches = checkIn >= d0 && checkIn <= d1;
        }
      } else if (basis === 'occupancy') {
        if (typeof occ !== 'number') matches = false;
        else {
          const start = s.range_start != null ? Number(s.range_start) : 0;
          const end = s.range_end != null ? Number(s.range_end) : 1e9;
          matches = occ >= start && occ < end;
        }
      }

      if (!matches) continue;

      // Determine unit amount
      let delta = 0;
      if (method === 'flat') delta = Number(s.value || 0) * 100;
      if (method === 'percent') delta = Math.round((Number(s.value || 0) / 100) * baseMinor);
      if (method === 'per_unit') {
        let units = 1;
        if (basis === 'distance_km' && typeof dist === 'number') units = dist;
        else if (basis === 'hour' && typeof hour === 'number') units = 1;
        else if (basis === 'lead_time' && typeof lead === 'number') units = lead;
        delta = Math.round(units * Number(s.value || 0) * 100);
      }

      if (tag === 'price') {
        addLine(lines, 'price', delta, s.name);
        total += delta;
      } else if (tag === 'visit_fee') {
        addLine(lines, 'visit_fee', delta, s.name);
        total += delta;
      } else if (tag === 'refund_penalty') {
        // Represent penalty as a negative number in payable context (info only). Real penalty is applied on cancel.
        addLine(lines, 'refund_penalty', delta, s.name);
      } else if (tag === 'commission') {
        addLine(lines, 'commission', delta, s.name);
        total += delta;
      }
    }

    // Taxes (demo 0). In real use, apply GST here and push as a 'tax' line.
    return { currency: 'INR', lines, total_minor: Math.max(0, total) };
  }
}
