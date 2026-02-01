import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { CreateServiceAppointmentDto, generateAvailableSlots } from '@mangwale/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ServiceCatalog, ServiceSlot, ServiceAppointment } from './typeorm/entities';
import { StoreWorkingHours } from './typeorm/config-entities';
import { StoreBreaks } from './typeorm/config-entities';

function idemp(key: string) {
  return { headers: { 'Idempotency-Key': key } };
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceCatalog) private readonly catalogRepo: Repository<ServiceCatalog>,
    @InjectRepository(ServiceSlot) private readonly slotRepo: Repository<ServiceSlot>,
    @InjectRepository(ServiceAppointment) private appointments: Repository<ServiceAppointment>,
    @InjectRepository(StoreWorkingHours) private workingHoursRepo: Repository<StoreWorkingHours>,
    @InjectRepository(StoreBreaks) private breaksRepo: Repository<StoreBreaks>
  ) { }

  async catalog(q: any) {
    const where: any = {};
    if (q.store_id) where.store_id = Number(q.store_id);
    const items = await this.catalogRepo.find({ where, take: 100, order: { id: 'DESC' } });
    return { items, total: items.length };
  }

  async getServiceById(id: number) {
    const item = await this.catalogRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Service not found');
    }
    return item;
  }

  async slots(q: any) {
    const where: any = {};
    if (q.store_id) where.store_id = Number(q.store_id);
    if (q.date) where.date = String(q.date);
    const items = await this.slotRepo.find({ where, take: 200, order: { id: 'DESC' } });
    return { items, total: items.length };
  }

  async book(dto: CreateServiceAppointmentDto) {
    // 1) Check if slot is available
    if (dto.slotId) {
      const slot = await this.slotRepo.findOne({ where: { id: dto.slotId } });
      if (!slot) {
        throw new BadRequestException('Slot not found');
      }
      if (slot.booked >= slot.capacity) {
        throw new BadRequestException('Slot fully booked');
      }
    }

    // 2) Create appointment record
    const subtotal = dto.pricing.baseMinor + (dto.pricing.visitFeeMinor || 0);
    const taxMinor = dto.pricing.taxMinor || 0;
    const total = subtotal + taxMinor;

    const appointment = this.appointments.create({
      user_id: dto.userId,
      store_id: dto.storeId,
      service_id: dto.serviceId,
      slot_id: dto.slotId || null,
      scheduled_for: dto.scheduledFor,
      address_id: dto.addressId || null,
      status: 'pending',
      notes: null,
      payment_mode: dto.payment.mode || 'prepaid',
      base_amount: String(dto.pricing.baseMinor / 100),
      visit_fee: String((dto.pricing.visitFeeMinor || 0) / 100),
      tax_amount: String(taxMinor / 100),
      final_amount: String(total / 100),
    });
    await this.appointments.save(appointment);

    const V1 = process.env.V1_BASE_URL || 'http://localhost:8080';
    const userId = dto.userId;

    const financeMock = String(process.env.FINANCE_MOCK || (process.env.NODE_ENV === 'development' ? 'true' : '')) === 'true';
    const postOrMock = async (url: string, payload: any, headers: any) => {
      if (financeMock) return { data: { ok: true } };
      return axios.post(url, payload, headers);
    };

    // 3) Handle payment
    if (dto.payment.mode === 'prepaid' || dto.payment.mode === 'deposit') {
      if (dto.payment.walletMinor && dto.payment.walletMinor > 0) {
        await postOrMock(`${V1}/internal/wallet/use`, {
          user_id: userId,
          amount_minor: dto.payment.walletMinor,
          order_like_ref: appointment.id,
          idempotency_key: `job:${appointment.id}:wallet`,
        }, idemp(`job:${appointment.id}:wallet`));
      }
      const gatewayMinor = dto.payment.gatewayMinor || 0;
      if (gatewayMinor > 0) {
        await postOrMock(`${V1}/internal/wallet/capture`, {
          user_id: userId,
          amount_minor: gatewayMinor,
          reason: 'service_prepaid',
          idempotency_key: `job:${appointment.id}:capture`,
        }, idemp(`job:${appointment.id}:capture`));
      }
    }

    // 4) Mirror order in v1
    await postOrMock(`${V1}/internal/orders/mirror`, {
      external_ref: appointment.id,
      source_system: 'nest',
      module_type: 'service',
      zone_id: null,
      user_id: userId,
      vendor_id: dto.storeId,
      store_id: dto.storeId,
      amounts: {
        subtotal_minor: subtotal,
        tax_minor: taxMinor,
        fees_minor: 0,
        commission_minor: Math.round(total * 0.1),
        vendor_net_minor: Math.round(total * 0.9),
      },
      status: 'confirmed',
      metadata: { service_id: dto.serviceId, scheduled_for: dto.scheduledFor },
    }, idemp(`job:${appointment.id}:mirror`));

    // 5) Update slot booking count if applicable
    if (dto.slotId) {
      await this.slotRepo.increment({ id: dto.slotId }, 'booked', 1);
    }

    // 6) Update appointment status to confirmed
    appointment.status = 'confirmed';
    await this.appointments.save(appointment);

    return { jobId: appointment.id, status: appointment.status };
  }

  async complete(jobId: string, additionsMinor: number) {
    // 1) Find appointment
    const appointment = await this.appointments.findOne({ where: { id: jobId } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === 'completed') {
      return { jobId, status: 'completed', message: 'Already completed' };
    }

    // 2) Calculate final amount
    const baseAmount = parseFloat(appointment.base_amount);
    const visitFee = parseFloat(appointment.visit_fee);
    const taxAmount = parseFloat(appointment.tax_amount);
    const paidAmount = baseAmount + visitFee + taxAmount;
    const finalAmount = paidAmount + (additionsMinor / 100);

    appointment.final_amount = String(finalAmount);
    appointment.status = 'completed';
    await this.appointments.save(appointment);

    // 3) If there are additions and payment mode is COD or deposit, charge the difference
    const V1 = process.env.V1_BASE_URL || 'http://localhost:8080';
    const financeMock = String(process.env.FINANCE_MOCK || (process.env.NODE_ENV === 'development' ? 'true' : '')) === 'true';
    const postOrMock = async (url: string, payload: any, headers: any) => {
      if (financeMock) return { data: { ok: true } };
      return axios.post(url, payload, headers);
    };

    if (additionsMinor > 0 && (appointment.payment_mode === 'cod' || appointment.payment_mode === 'deposit')) {
      await postOrMock(`${V1}/internal/wallet/capture`, {
        user_id: appointment.user_id,
        amount_minor: additionsMinor,
        reason: 'service_additions',
        idempotency_key: `job:${jobId}:additions`,
      }, idemp(`job:${jobId}:additions`));
    }

    return { jobId, status: 'completed', additions_minor: additionsMinor };
  }

  async cancel(jobId: string, askRefundDestination: boolean) {
    // 1) Find appointment
    const appointment = await this.appointments.findOne({ where: { id: jobId } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      return { jobId, refunded_minor: 0, message: 'Already cancelled' };
    }

    // 2) Calculate refund based on cancellation policy
    const baseAmount = parseFloat(appointment.base_amount);
    const visitFee = parseFloat(appointment.visit_fee);
    const taxAmount = parseFloat(appointment.tax_amount);
    const paidAmount = baseAmount + visitFee + taxAmount;
    const paidMinor = Math.round(paidAmount * 100);

    // Simple policy: full refund if cancelled 24+ hours before, else keep visit fee
    const scheduledDate = new Date(appointment.scheduled_for);
    const now = new Date();
    const hoursUntilScheduled = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundMinor = 0;
    const visitFeeMinor = Math.round(parseFloat(appointment.visit_fee) * 100);

    if (hoursUntilScheduled >= 24) {
      refundMinor = paidMinor; // Full refund
    } else if (hoursUntilScheduled >= 6) {
      refundMinor = paidMinor - visitFeeMinor; // Keep visit fee as penalty
    }
    // else no refund

    // 3) Update appointment status
    appointment.status = 'cancelled';
    await this.appointments.save(appointment);

    // 4) Restore slot if applicable
    if (appointment.slot_id) {
      await this.slotRepo.decrement({ id: appointment.slot_id }, 'booked', 1);
    }

    // 5) Process refund via v1
    const V1 = process.env.V1_BASE_URL || 'http://localhost:8080';
    const financeMock = String(process.env.FINANCE_MOCK || (process.env.NODE_ENV === 'development' ? 'true' : '')) === 'true';
    const postOrMock = async (url: string, payload: any, headers: any) => {
      if (financeMock) return { data: { ok: true } };
      return axios.post(url, payload, headers);
    };

    if (refundMinor > 0) {
      await postOrMock(`${V1}/internal/wallet/refund`, {
        user_id: appointment.user_id,
        amount_minor: refundMinor,
        to: askRefundDestination ? 'wallet' : 'source',
        order_like_ref: jobId,
        idempotency_key: `job:${jobId}:refund`,
      }, idemp(`job:${jobId}:refund`));
    }

    return { jobId, refunded_minor: refundMinor };
  }

  async getUserAppointments(userId: number) {
    const appointments = await this.appointments.find({
      where: { user_id: userId },
      relations: ['service', 'slot'],
      order: { created_at: 'DESC' },
      take: 50,
    });
    return { appointments, total: appointments.length };
  }

  async getVendorAppointments(storeId: number, status?: string) {
    const where: any = { store_id: storeId };
    if (status) where.status = status;

    const appointments = await this.appointments.find({
      where,
      relations: ['service', 'slot'],
      order: { created_at: 'DESC' },
      take: 100,
    });
    return appointments;
  }

  async getAppointmentById(id: string) {
    const appointment = await this.appointments.findOne({
      where: { id },
      relations: ['service', 'slot'],
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  /**
   * Generate smart slots based on service duration and buffer time
   * Reads configuration from database, no hardcoded values
   */
  async getSmartSlots(serviceId: number, date: string, storeId: number) {
    // 1. Get service details from database
    const service = await this.catalogRepo.findOne({
      where: { id: serviceId }
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.duration_min) {
      throw new BadRequestException('Service duration not configured. Please set duration_min in the database.');
    }

    // 2. Get working hours from database
    const workingHoursData = await this.workingHoursRepo.findOne({
      where: { store_id: storeId, module_type: 'services', is_active: true }
    });

    if (!workingHoursData) {
      throw new NotFoundException('Working hours not configured for this store');
    }

    // Get breaks from database
    const breaksData = await this.breaksRepo.find({
      where: { store_id: storeId, module_type: 'services', is_active: true }
    });

    const workingHours = {
      start: workingHoursData.start_time,
      end: workingHoursData.end_time,
      breaks: breaksData.map(b => ({
        start: b.break_start_time,
        end: b.break_end_time
      }))
    };

    // 3. Get existing appointments for this date from database
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);

    const existingAppointments = await this.appointments.find({
      where: {
        store_id: storeId,
        scheduled_for: Between(startOfDay, endOfDay)
      },
      relations: ['service'],
      select: ['id', 'scheduled_for', 'service_id']
    });

    // 4. Convert to format expected by slot generator
    const existingBookings = existingAppointments.map(appt => ({
      start_time: appt.scheduled_for,
      duration_min: appt.service?.duration_min || service.duration_min,
      buffer_min: appt.service?.buffer_time_min || service.buffer_time_min || 15
    }));

    // 5. Generate available slots using shared service (database-driven)
    const slots = generateAvailableSlots(
      {
        duration_min: service.duration_min,
        buffer_time_min: service.buffer_time_min || 15,
        id: service.id,
        name: service.name
      },
      workingHours,
      existingBookings
    );

    return {
      service_id: service.id,
      service_name: service.name,
      duration_min: service.duration_min,
      buffer_min: service.buffer_time_min || 15,
      date,
      available_slots: slots,
      total_slots: slots.length
    };
  }
}
