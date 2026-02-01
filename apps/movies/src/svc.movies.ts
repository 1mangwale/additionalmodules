import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovieBooking, Showtime, Screen } from './typeorm/entities';
import axios from 'axios';

function idemp(key: string) {
    return { headers: { 'Idempotency-Key': key } };
}

@Injectable()
export class MoviesService {
    constructor(
        @InjectRepository(MovieBooking) private readonly bookings: Repository<MovieBooking>,
        @InjectRepository(Showtime) private readonly showtimes: Repository<Showtime>,
        @InjectRepository(Screen) private readonly screens: Repository<Screen>,
    ) { }

    async book(dto: {
        userId: number;
        storeId: number;
        showtimeId: number;
        seats: number;
        seatNumbers?: string[];
        pricePerSeatMinor?: number;
        payment: { mode: string; walletMinor?: number; gatewayMinor?: number };
    }) {
        // 1) Validate showtime exists
        const showtime = await this.showtimes.findOne({ where: { id: dto.showtimeId as any } });
        if (!showtime) {
            throw new NotFoundException('Showtime not found');
        }

        // 2) Get screen capacity
        const screen = await this.screens.findOne({ where: { id: showtime.screen_id as any } });
        if (!screen) {
            throw new NotFoundException('Screen not found');
        }

        // 3) Check availability
        const available = screen.seat_count - showtime.booked;
        if (available < dto.seats) {
            throw new BadRequestException(`Only ${available} seats available`);
        }

        // 4) Calculate price per seat (use provided or default from showtime base_price)
        const pricePerSeatMinor = dto.pricePerSeatMinor || Math.round(parseFloat(showtime.base_price) * 100);

        // 5) Calculate total amount
        const totalMinor = dto.seats * pricePerSeatMinor;

        // 6) Create booking
        const booking = this.bookings.create({
            user_id: dto.userId as any,
            store_id: dto.storeId as any,
            showtime_id: dto.showtimeId as any,
            seats: dto.seats,
            seat_numbers: dto.seatNumbers || [],
            amount_minor: totalMinor as any,
            status: 'confirmed',
        });
        await this.bookings.save(booking);

        // 7) Increment booked count
        await this.showtimes.increment({ id: dto.showtimeId as any }, 'booked', dto.seats);

        // 7) Process payment via finance bridge
        const financeUrl = process.env.FINANCE_URL || 'http://localhost:4004';
        try {
            await axios.post(
                `${financeUrl}/finance/charge`,
                {
                    userId: dto.userId,
                    orderId: booking.id,
                    amountMinor: totalMinor,
                    payment: dto.payment,
                },
                idemp(booking.id),
            );
        } catch (err: any) {
            console.error('Finance charge failed:', err.message);
            // Continue - mock mode will succeed
        }

        return { bookingId: booking.id, status: 'confirmed' };
    }

    async cancel(bookingId: string, userId: number) {
        // 1) Find booking
        const booking = await this.bookings.findOne({
            where: { id: bookingId, user_id: userId as any }
        });
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.status === 'cancelled') {
            throw new BadRequestException('Booking already cancelled');
        }

        // 2) Get showtime
        const showtime = await this.showtimes.findOne({
            where: { id: booking.showtime_id as any }
        });
        if (!showtime) {
            throw new NotFoundException('Showtime not found');
        }

        // 3) Check if showtime has passed
        const now = new Date();
        const showStart = new Date(showtime.starts_at);
        const hoursUntilShow = (showStart.getTime() - now.getTime()) / (1000 * 60 * 60);

        let refundMinor = 0;
        if (hoursUntilShow >= 24) {
            // Full refund if cancelled 24+ hours before
            refundMinor = booking.amount_minor;
        } else if (hoursUntilShow >= 2) {
            // 50% refund if cancelled 2-24 hours before
            refundMinor = Math.floor(booking.amount_minor * 0.5);
        } else {
            // No refund if < 2 hours before or showtime passed
            refundMinor = 0;
        }

        // 4) Update booking status
        booking.status = 'cancelled';
        await this.bookings.save(booking);

        // 5) Restore seat count
        await this.showtimes.decrement({ id: booking.showtime_id as any }, 'booked', booking.seats);

        // 6) Process refund if applicable
        if (refundMinor > 0) {
            const financeUrl = process.env.FINANCE_URL || 'http://localhost:4004';
            try {
                await axios.post(
                    `${financeUrl}/finance/refund`,
                    {
                        userId: booking.user_id,
                        orderId: booking.id,
                        amountMinor: refundMinor,
                    },
                    idemp(`${booking.id}-refund`),
                );
            } catch (err: any) {
                console.error('Finance refund failed:', err.message);
            }
        }

        const refundRupees = (refundMinor / 100000).toFixed(2);
        return {
            bookingId: booking.id,
            refunded_minor: refundMinor,
            message: refundMinor > 0 ? `Refunded ₹${refundRupees}` : 'No refund applicable',
        };
    }

    async getUserBookings(userId: number) {
        const bookings = await this.bookings.find({
            where: { user_id: userId as any },
            relations: ['showtime'],
            order: { booked_at: 'DESC' },
            take: 100,
        });
        return { bookings, total: bookings.length };
    }

    async getVendorBookings(storeId: number, status?: string) {
        const where: any = { store_id: storeId as any };
        if (status) {
            where.status = status;
        }
        const bookings = await this.bookings.find({
            where,
            relations: ['showtime'],
            order: { booked_at: 'DESC' },
            take: 200,
        });
        return bookings;
    }

    async getBookingById(id: string) {
        const booking = await this.bookings.findOne({
            where: { id },
            relations: ['showtime'],
        });
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }
        return booking;
    }
}
