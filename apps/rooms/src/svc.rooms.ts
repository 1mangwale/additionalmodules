import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateRoomBookingDto } from './dto';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomType, RoomInventory, RoomBooking, RoomBookingItem } from './typeorm/entities';

function idemp(key: string) {
  return { headers: { 'Idempotency-Key': key } };
}

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(RoomType) private readonly roomTypes: Repository<RoomType>,
    @InjectRepository(RoomInventory) private readonly inventory: Repository<RoomInventory>,
    @InjectRepository(RoomBooking) private readonly bookings: Repository<RoomBooking>,
    @InjectRepository(RoomBookingItem) private readonly bookingItems: Repository<RoomBookingItem>,
  ) { }

  async searchRooms(q: any) {
    const where: any = {};
    if (q.store_id) where.store_id = Number(q.store_id);
    if (q.adults) where.occupancy_adults = Number(q.adults);
    const items = await this.roomTypes.find({ where, take: 100, order: { id: 'DESC' } });
    return { items, total: items.length };
  }

  async getRoomById(id: number) {
    const room = await this.roomTypes.findOne({ where: { id } });
    if (!room) return { message: 'Not Found', status: 404 } as any;
    return room;
  }

  async price(body: any) {
    const PRICING = process.env.PRICING_BASE_URL || 'http://localhost:4003';
    const payload = {
      module: 'room',
      storeId: Number(body.storeId || 1),
      inputs: {
        checkIn: body.checkIn || body.checkin,
        checkOut: body.checkOut || body.checkout,
        nights: body.nights || 1,
        roomTypeId: body.roomTypeId || body.room_type_id,
        ratePlanId: body.ratePlanId || body.rate_plan_id,
      },
    };
    try {
      const r = await axios.post(`${PRICING}/pricing/quote`, payload);
      return r.data;
    } catch {
      return { currency: 'INR', lines: [], total_minor: 0 };
    }
  }

  async book(dto: CreateRoomBookingDto) {
    // 1) Check availability first
    const available = await this.checkAvailability(dto);
    if (!available) {
      throw new BadRequestException('No rooms available for selected dates');
    }

    // 2) Create booking record
    const booking = this.bookings.create({
      user_id: dto.userId,
      store_id: dto.storeId,
      check_in: dto.checkIn,
      check_out: dto.checkOut,
      rooms: dto.rooms,
      adults: dto.adults,
      children: dto.children,
      status: 'pending',
    });
    await this.bookings.save(booking);

    // 3) Create booking items
    const items = Array.isArray(dto.items) ? dto.items : [];
    for (const item of items) {
      const bookingItem = this.bookingItems.create({
        booking_id: booking.id,
        room_type_id: item.roomTypeId,
        rate_plan_id: item.ratePlanId,
        nights: item.nights,
        price_per_night: String(item.pricePerNightMinor / 100),
        tax_amount: String(item.taxMinor / 100),
        total: String(item.totalMinor / 100),
      });
      await this.bookingItems.save(bookingItem);
    }

    // 4) Decrement inventory for each date
    await this.decrementInventory(dto);

    // 5) Collect funds via v1 (Finance Bridge endpoints)
    const V1 = process.env.V1_BASE_URL || 'http://localhost:8080';
    const userId = dto.userId;
    const total = items.reduce((s, it) => s + (it.totalMinor || 0), 0);

    const financeMock = String(process.env.FINANCE_MOCK || process.env.NODE_ENV === 'development') === 'true' || process.env.NODE_ENV === 'development';
    const mockOk = async (_: any) => ({ data: { ok: true } });
    const postOrMock = async (url: string, payload: any, headers: any) => {
      if (financeMock) return mockOk(payload);
      return axios.post(url, payload, headers);
    };

    if (dto.payment.mode === 'prepaid' || dto.payment.mode === 'partial') {
      if (dto.payment.walletMinor && dto.payment.walletMinor > 0) {
        await postOrMock(`${V1}/internal/wallet/use`, {
          user_id: userId,
          amount_minor: dto.payment.walletMinor,
          order_like_ref: booking.id,
          idempotency_key: `booking:${booking.id}:wallet`,
        }, idemp(`booking:${booking.id}:wallet`));
      }
      const gatewayMinor = dto.payment.gatewayMinor || 0;
      if (gatewayMinor > 0) {
        await postOrMock(`${V1}/internal/wallet/capture`, {
          user_id: userId,
          amount_minor: gatewayMinor,
          reason: 'room_prepaid',
          idempotency_key: `booking:${booking.id}:capture`,
        }, idemp(`booking:${booking.id}:capture`));
      }
    }

    // 6) Mirror order in v1 for settlement
    await postOrMock(`${V1}/internal/orders/mirror`, {
      external_ref: booking.id,
      source_system: 'nest',
      module_type: 'room',
      zone_id: null,
      user_id: userId,
      vendor_id: dto.storeId,
      store_id: dto.storeId,
      amounts: {
        subtotal_minor: total,
        tax_minor: 0,
        fees_minor: 0,
        commission_minor: Math.round(total * 0.1),
        vendor_net_minor: Math.round(total * 0.9),
      },
      status: 'confirmed',
      metadata: { check_in: dto.checkIn, check_out: dto.checkOut },
    }, idemp(`booking:${booking.id}:mirror`));

    // 7) Update booking status to confirmed
    booking.status = 'confirmed';
    await this.bookings.save(booking);

    return { bookingId: booking.id, status: booking.status };
  }

  private async checkAvailability(dto: CreateRoomBookingDto): Promise<boolean> {
    const dates = this.getDatesInRange(dto.checkIn, dto.checkOut);

    for (const item of dto.items) {
      for (const date of dates) {
        const inv = await this.inventory.findOne({
          where: { room_type_id: item.roomTypeId, date }
        });

        if (!inv) return false; // No inventory for this date
        if (inv.status !== 'open') return false; // Closed for booking
        if (inv.sold_rooms + dto.rooms > inv.total_rooms) return false; // Would be overbooked
      }
    }

    return true;
  }

  private async decrementInventory(dto: CreateRoomBookingDto): Promise<void> {
    const dates = this.getDatesInRange(dto.checkIn, dto.checkOut);

    for (const item of dto.items) {
      for (const date of dates) {
        await this.inventory.increment(
          { room_type_id: item.roomTypeId, date },
          'sold_rooms',
          dto.rooms
        );
      }
    }
  }

  private getDatesInRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Note: For hotel bookings, we typically don't include the checkout date
    const current = new Date(start);
    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  async cancel(bookingId: string, askRefundDestination: boolean) {
    // 1) Find booking
    const booking = await this.bookings.findOne({
      where: { id: bookingId },
      relations: ['items', 'items.roomType'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'cancelled') {
      return { bookingId, refunded_minor: 0, message: 'Already cancelled' };
    }

    // 2) Calculate refund amount based on cancellation policy
    const totalPaid = booking.items.reduce((sum, item) =>
      sum + parseFloat(item.total), 0
    );
    const totalPaidMinor = Math.round(totalPaid * 100);

    // Simple refund logic: full refund if cancelled 24+ hours before check-in
    const checkInDate = new Date(booking.check_in);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundMinor = 0;
    if (hoursUntilCheckIn >= 24) {
      refundMinor = totalPaidMinor; // Full refund
    } else if (hoursUntilCheckIn >= 6) {
      refundMinor = Math.round(totalPaidMinor * 0.5); // 50% refund
    }
    // else no refund

    // 3) Update booking status
    booking.status = 'cancelled';
    await this.bookings.save(booking);

    // 4) Restore inventory
    await this.restoreInventory(booking);

    // 5) Process refund via v1
    const V1 = process.env.V1_BASE_URL || 'http://localhost:8080';
    const financeMock = String(process.env.FINANCE_MOCK || process.env.NODE_ENV === 'development') === 'true' || process.env.NODE_ENV === 'development';
    const postOrMock = async (url: string, payload: any, headers: any) => {
      if (financeMock) return { data: { ok: true } };
      return axios.post(url, payload, headers);
    };

    if (refundMinor > 0) {
      await postOrMock(`${V1}/internal/wallet/refund`, {
        user_id: booking.user_id,
        amount_minor: refundMinor,
        to: askRefundDestination ? 'wallet' : 'source',
        order_like_ref: bookingId,
        idempotency_key: `booking:${bookingId}:refund`,
      }, idemp(`booking:${bookingId}:refund`));
    }

    return { bookingId, refunded_minor: refundMinor };
  }

  private async restoreInventory(booking: RoomBooking): Promise<void> {
    const dates = this.getDatesInRange(booking.check_in, booking.check_out);

    for (const item of booking.items) {
      for (const date of dates) {
        await this.inventory.decrement(
          { room_type_id: item.room_type_id, date },
          'sold_rooms',
          booking.rooms
        );
      }
    }
  }

  async getUserBookings(userId: number) {
    const bookings = await this.bookings.find({
      where: { user_id: userId },
      relations: ['items', 'items.roomType'],
      order: { created_at: 'DESC' },
      take: 50,
    });
    return { bookings, total: bookings.length };
  }

  async getVendorBookings(storeId: number, status?: string) {
    const where: any = { store_id: storeId };
    if (status) where.status = status;

    const bookings = await this.bookings.find({
      where,
      relations: ['items', 'items.roomType'],
      order: { created_at: 'DESC' },
      take: 100,
    });
    return bookings;
  }

  async getBookingById(id: string) {
    const booking = await this.bookings.findOne({
      where: { id },
      relations: ['items', 'items.roomType'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
}
