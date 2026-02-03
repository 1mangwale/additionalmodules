import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant, TableType, TableBooking } from './typeorm/entities';
import { CreateTableBookingDto } from './dto';
import axios from 'axios';

function idemp(key: string) {
  return { headers: { 'idempotency-key': key } };
}

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant) private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(TableType) private readonly tables: Repository<TableType>,
    @InjectRepository(TableBooking) private readonly bookings: Repository<TableBooking>,
  ) { }

  async searchRestaurants(q: any) {
    const where: any = {};
    if (q.store_id) where.store_id = Number(q.store_id);
    if (q.cuisine_type) where.cuisine_type = q.cuisine_type;
    if (q.status) where.status = q.status;
    else where.status = 'active';

    const items = await this.restaurants.find({
      where,
      take: 100,
      order: { id: 'DESC' }
    });
    return { items, total: items.length };
  }

  async getRestaurantById(id: number) {
    const restaurant = await this.restaurants.findOne({
      where: { id },
      relations: ['tables']
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  async searchAvailableTables(q: { restaurant_id: number; date: string; time: string; party_size: number }) {
    const restaurantId = Number(q.restaurant_id);
    const partySize = Number(q.party_size);

    // Get all tables for this restaurant that can accommodate party size
    const allTables = await this.tables.find({
      where: {
        restaurant_id: restaurantId,
        status: 'available'
      },
    });

    // Filter tables that have sufficient capacity
    const suitableTables = allTables.filter(t => t.capacity >= partySize);

    // Check which tables are already booked for this date/time
    const bookingTime = q.time.length === 5 ? q.time + ':00' : q.time;
    const existingBookings = await this.bookings.find({
      where: {
        restaurant_id: restaurantId,
        booking_date: q.date,
        status: 'confirmed'
      }
    });

    // Filter out booked tables (simple overlap check)
    const availableTables = suitableTables.filter(table => {
      return !existingBookings.some(booking => {
        if (booking.table_type_id !== table.id) return false;

        // Check time overlap (simplified - assumes 2 hour default duration)
        const bookingStart = this.timeToMinutes(booking.booking_time);
        const bookingEnd = bookingStart + (booking.duration_minutes || 120);
        const requestStart = this.timeToMinutes(bookingTime);
        const requestEnd = requestStart + 120;

        return !(requestEnd <= bookingStart || requestStart >= bookingEnd);
      });
    });

    return { items: availableTables, total: availableTables.length };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async book(dto: CreateTableBookingDto) {
    // 1) Validate restaurant and table exist
    const restaurant = await this.restaurants.findOne({ where: { id: dto.restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const table = await this.tables.findOne({ where: { id: dto.tableTypeId } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.capacity < dto.partySize) {
      throw new BadRequestException(`Table capacity (${table.capacity}) insufficient for party size (${dto.partySize})`);
    }

    // 2) Check availability
    const bookingTime = dto.bookingTime.length === 5 ? dto.bookingTime + ':00' : dto.bookingTime;
    const durationMinutes = dto.durationMinutes || 120;

    const available = await this.checkAvailability(
      dto.tableTypeId,
      dto.bookingDate,
      bookingTime,
      durationMinutes
    );

    if (!available) {
      throw new BadRequestException('Table not available for selected time slot');
    }

    // 3) Create booking
    const booking = this.bookings.create({
      user_id: dto.userId,
      store_id: dto.storeId,
      restaurant_id: dto.restaurantId,
      table_type_id: dto.tableTypeId,
      booking_date: dto.bookingDate,
      booking_time: bookingTime,
      party_size: dto.partySize,
      duration_minutes: durationMinutes,
      customer_name: dto.customerName,
      customer_phone: dto.customerPhone,
      special_requests: dto.specialRequests,
      amount_minor: dto.payment?.walletMinor || 0,
      status: 'pending',
      payment_mode: dto.payment?.mode || 'at-venue',
    });

    await this.bookings.save(booking);

    // 4) Process payment if prepaid
    if (dto.payment?.mode === 'prepaid' && dto.payment.walletMinor) {
      const financeUrl = process.env.FINANCE_URL || 'http://localhost:4004';
      const financeMock = String(process.env.FINANCE_MOCK || process.env.NODE_ENV === 'development') === 'true';

      try {
        if (!financeMock) {
          await axios.post(
            `${financeUrl}/finance/collect`,
            {
              user_id: dto.userId,
              wallet_minor: dto.payment.walletMinor,
              gateway_minor: dto.payment.gatewayMinor || 0,
            },
            idemp(`table-booking:${booking.id}:collect`)
          );
        }

        // Mirror order to v1
        const v1BaseUrl = process.env.V1_BASE_URL || 'http://localhost:8080';
        if (!financeMock) {
          await axios.post(`${v1BaseUrl}/v1/orders`, {
            order_id: booking.id,
            user_id: dto.userId,
            store_id: dto.storeId,
            type: 'table_booking',
            items: [{
              name: `Table ${table.table_number} - ${dto.partySize} guests`,
              quantity: 1,
              price_minor: dto.payment.walletMinor,
            }],
            payment: {
              total_minor: dto.payment.walletMinor,
              vendor_net_minor: Math.round((dto.payment.walletMinor || 0) * 0.9),
            },
            status: 'confirmed',
            metadata: {
              booking_date: dto.bookingDate,
              booking_time: dto.bookingTime,
              restaurant_id: dto.restaurantId,
              table_id: dto.tableTypeId,
            },
          }, idemp(`table-booking:${booking.id}:mirror`));
        }
      } catch (error: any) {
        // Rollback booking on payment failure
        await this.bookings.remove(booking);
        throw new BadRequestException('Payment failed: ' + error.message);
      }
    }

    // 5) Confirm booking
    booking.status = 'confirmed';
    await this.bookings.save(booking);

    return { bookingId: booking.id, status: booking.status };
  }

  private async checkAvailability(
    tableTypeId: number,
    date: string,
    time: string,
    durationMinutes: number
  ): Promise<boolean> {
    const existingBookings = await this.bookings.find({
      where: {
        table_type_id: tableTypeId,
        booking_date: date,
        status: 'confirmed',
      },
    });

    const requestStart = this.timeToMinutes(time);
    const requestEnd = requestStart + durationMinutes;

    for (const booking of existingBookings) {
      const bookingStart = this.timeToMinutes(booking.booking_time);
      const bookingEnd = bookingStart + booking.duration_minutes;

      // Check overlap
      if (!(requestEnd <= bookingStart || requestStart >= bookingEnd)) {
        return false;
      }
    }

    return true;
  }

  async cancel(bookingId: string, userId?: number) {
    const booking = await this.bookings.findOne({
      where: { id: bookingId },
      relations: ['tableType'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (userId && booking.user_id !== userId) {
      throw new BadRequestException('Unauthorized to cancel this booking');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking already cancelled');
    }

    // Calculate refund based on time until booking
    const now = new Date();
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundAmount = 0;
    if (hoursUntilBooking >= 24) {
      refundAmount = booking.amount_minor; // Full refund
    } else if (hoursUntilBooking >= 6) {
      refundAmount = Math.round(booking.amount_minor * 0.5); // 50% refund
    }
    // else no refund

    // Process refund if applicable
    if (refundAmount > 0 && booking.payment_mode === 'prepaid') {
      const financeUrl = process.env.FINANCE_URL || 'http://localhost:4004';
      const financeMock = String(process.env.FINANCE_MOCK || process.env.NODE_ENV === 'development') === 'true';

      try {
        if (!financeMock) {
          await axios.post(
            `${financeUrl}/finance/refund`,
            {
              user_id: booking.user_id,
              wallet_minor: refundAmount,
              destination: 'wallet',
            },
            idemp(`table-booking:${bookingId}:refund`)
          );
        }
      } catch (error: any) {
        console.error('Refund failed:', error.message);
      }
    }

    // Update booking status
    booking.status = 'cancelled';
    await this.bookings.save(booking);

    return {
      bookingId: booking.id,
      status: booking.status,
      refundAmount,
      message: refundAmount > 0 ? `Refunded ₹${(refundAmount / 100).toFixed(2)}` : 'No refund applicable'
    };
  }

  async getUserBookings(userId: number) {
    const bookings = await this.bookings.find({
      where: { user_id: userId },
      relations: ['tableType', 'restaurant'],
      order: { created_at: 'DESC' },
      take: 100,
    });
    return bookings;
  }

  async getVendorBookings(storeId: number, status?: string) {
    const where: any = { store_id: storeId };
    if (status) where.status = status;

    const bookings = await this.bookings.find({
      where,
      relations: ['tableType', 'restaurant'],
      order: { created_at: 'DESC' },
      take: 100,
    });
    return bookings;
  }

  async getBookingById(id: string) {
    const booking = await this.bookings.findOne({
      where: { id },
      relations: ['tableType', 'restaurant'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async updateBookingStatus(bookingId: string, status: string) {
    const booking = await this.getBookingById(bookingId);
    booking.status = status;
    await this.bookings.save(booking);
    return booking;
  }
}
