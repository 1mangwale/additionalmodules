import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { VenueType, VenueSlot, VenueBooking } from './typeorm/entities';
import { generateAvailableSlotsWithPricing } from '@mangwale/shared';
import { StoreWorkingHours, VenuePeakPricing } from './typeorm/config-entities';
import axios from 'axios';

function idemp(key: string) {
    return { headers: { 'Idempotency-Key': key } };
}

@Injectable()
export class VenuesService {
    constructor(
        @InjectRepository(VenueType) private readonly venueTypes: Repository<VenueType>,
        @InjectRepository(VenueSlot) private readonly slots: Repository<VenueSlot>,
        @InjectRepository(VenueBooking) private readonly bookings: Repository<VenueBooking>,
        @InjectRepository(StoreWorkingHours) private readonly workingHoursRepo: Repository<StoreWorkingHours>,
        @InjectRepository(VenuePeakPricing) private readonly peakPricingRepo: Repository<VenuePeakPricing>
    ) { }

    async catalog(q: any) {
        const where: any = {};
        if (q.store_id) where.store_id = Number(q.store_id);
        if (q.venue_category) where.venue_category = q.venue_category;
        const items = await this.venueTypes.find({ where, take: 100, order: { id: 'DESC' } });
        return { items, total: items.length };
    }

    async getVenueById(id: number) {
        const venue = await this.venueTypes.findOne({ where: { id } });
        if (!venue) {
            throw new NotFoundException('Venue not found');
        }
        return venue;
    }

    async listSlots(q: any) {
        const where: any = {};
        if (q.store_id) where.store_id = Number(q.store_id);
        if (q.venue_type_id) where.venue_type_id = Number(q.venue_type_id);
        if (q.date) where.date = String(q.date);
        const items = await this.slots.find({ where, take: 200, order: { date: 'ASC', hour_start: 'ASC' } });
        return { items, total: items.length };
    }

    async book(dto: {
        userId: number;
        storeId: number;
        venueTypeId: number;
        slotId: number;
        date?: string;
        hours?: number;
        pricing?: { baseMinor: number; taxMinor: number };
        amountMinor?: number;
        payment: { mode: string; walletMinor?: number; gatewayMinor?: number };
    }) {
        // 1) Validate slot exists and is available
        const slot = await this.slots.findOne({ where: { id: dto.slotId as any } });
        if (!slot) {
            throw new NotFoundException('Slot not found');
        }

        if (slot.status !== 'open') {
            throw new BadRequestException('Slot is not available');
        }

        if (slot.booked >= slot.capacity) {
            throw new BadRequestException('Slot is fully booked');
        }

        // 2) Validate venue exists
        const venue = await this.venueTypes.findOne({ where: { id: dto.venueTypeId as any } });
        if (!venue) {
            throw new NotFoundException('Venue not found');
        }

        // 3) Calculate amount
        const amountMinor = dto.amountMinor || (dto.pricing ? dto.pricing.baseMinor + (dto.pricing.taxMinor || 0) : 0);
        const hours = dto.hours || (slot.hour_end - slot.hour_start);

        // 4) Create booking
        const booking = this.bookings.create({
            user_id: dto.userId as any,
            store_id: dto.storeId as any,
            venue_type_id: dto.venueTypeId as any,
            slot_id: dto.slotId as any,
            booking_date: dto.date || slot.date,
            hours: hours,
            amount_minor: amountMinor as any,
            status: 'confirmed',
            payment_mode: dto.payment.mode,
        });
        await this.bookings.save(booking);

        // 5) Increment booked count
        await this.slots.increment({ id: dto.slotId as any }, 'booked', 1);

        // 6) Process payment
        const financeUrl = process.env.FINANCE_URL || 'http://localhost:4004';
        try {
            await axios.post(
                `${financeUrl}/finance/charge`,
                {
                    userId: dto.userId,
                    orderId: booking.id,
                    amountMinor: dto.amountMinor,
                    payment: dto.payment,
                },
                idemp(booking.id),
            );
        } catch (err: any) {
            console.error('Finance charge failed:', err.message);
        }

        return { bookingId: booking.id, status: 'confirmed' };
    }

    async cancel(bookingId: string, userId: number) {
        // 1) Find booking
        const booking = await this.bookings.findOne({
            where: { id: bookingId, user_id: userId as any },
            relations: ['slot'],
        });
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.status === 'cancelled') {
            throw new BadRequestException('Booking already cancelled');
        }

        // 2) Check cancellation policy (24 hours before)
        const now = new Date();
        const bookingDate = new Date(booking.booking_date);
        const slot = booking.slot;
        if (slot) {
            bookingDate.setHours(slot.hour_start, 0, 0, 0);
        }

        const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        let refundMinor = 0;
        if (hoursUntil >= 24) {
            // Full refund if cancelled 24+ hours before
            refundMinor = booking.amount_minor;
        } else if (hoursUntil >= 6) {
            // 50% refund if cancelled 6-24 hours before
            refundMinor = Math.floor(booking.amount_minor * 0.5);
        } else {
            // No refund if < 6 hours before
            refundMinor = 0;
        }

        // 3) Update booking status
        booking.status = 'cancelled';
        await this.bookings.save(booking);

        // 4) Restore slot availability
        await this.slots.decrement({ id: booking.slot_id as any }, 'booked', 1);

        // 5) Process refund
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
            relations: ['venueType', 'slot'],
            order: { created_at: 'DESC' },
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
            relations: ['venueType', 'slot'],
            order: { created_at: 'DESC' },
            take: 200,
        });
        return bookings;
    }

    async getBookingById(id: string) {
        const booking = await this.bookings.findOne({
            where: { id },
            relations: ['venueType', 'slot'],
        });
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }
        return booking;
    }

    /**
     * Generate smart slots based on venue session duration and buffer time
     * Supports variable pricing for peak/off-peak hours
     */
    async getSmartSlots(venueTypeId: number, date: string) {
        // 1. Get venue type details from database
        const venue = await this.venueTypes.findOne({
            where: { id: venueTypeId as any }
        });

        if (!venue) {
            throw new NotFoundException('Venue not found');
        }

        if (!venue.session_duration_min) {
            throw new BadRequestException('Venue session duration not configured. Please set session_duration_min in the database.');
        }

        // 2. Get working hours from database
        const workingHoursData = await this.workingHoursRepo.findOne({
            where: { store_id: venue.store_id, module_type: 'venues', is_active: true }
        });

        if (!workingHoursData) {
            throw new NotFoundException('Working hours not configured for this store');
        }

        const workingHours = {
            start: workingHoursData.start_time,
            end: workingHoursData.end_time,
            breaks: [] // Venues typically don't have breaks
        };

        // 3. Get existing bookings for this venue on this date from database
        const existingBookings = await this.bookingRepo.find({
            where: {
                venue_type_id: venueTypeId as any,
                booking_date: date
            },
            relations: ['venueType']
        });

        // 4. Convert to format expected by slot generator
        const bookedSlots = existingBookings.map(booking => ({
            start_time: `${booking.slot?.hour_start || 9}:00`,
            duration_min: venue.session_duration_min,
            buffer_min: venue.buffer_time_min || 15
        }));

        // 5. Get peak pricing rules from database
        const peakPricingData = await this.peakPricingRepo.find({
            where: {
                venue_type_id: venue.id,
                store_id: venue.store_id,
                is_active: true
            }
        });

        const pricingRules = {
            peak_hours: peakPricingData.map(p => ({
                start: p.peak_start_time,
                end: p.peak_end_time,
                multiplier: Number(p.price_multiplier)
            }))
        };

        // Calculate max multiplier and format peak hours string
        const maxMultiplier = peakPricingData.length > 0
            ? Math.max(...peakPricingData.map(p => Number(p.price_multiplier)))
            : 1.0;

        const peakHoursStr = peakPricingData
            .map(p => {
                const start = p.peak_start_time.substring(0, 5);
                const end = p.peak_end_time.substring(0, 5);
                return `${start}-${end}`;
            })
            .join(', ');

        // 6. Generate slots with pricing using shared service
        const basePrice = Number(venue.hourly_rate_minor) / 100;
        const slots = generateAvailableSlotsWithPricing(
            {
                duration_min: venue.session_duration_min,
                buffer_time_min: venue.buffer_time_min || 15,
                base_price: basePrice,
                id: venue.id,
                name: venue.name
            },
            workingHours,
            bookedSlots,
            pricingRules
        );

        return {
            venue_id: venue.id,
            venue_name: venue.name,
            venue_category: venue.venue_category,
            session_duration_min: venue.session_duration_min,
            buffer_min: venue.buffer_time_min || 15,
            base_price: basePrice,
            date,
            available_slots: slots,
            total_slots: slots.length,
            pricing_info: {
                off_peak_price: basePrice,
                peak_price: basePrice * maxMultiplier,
                peak_hours: peakHoursStr || 'No peak pricing configured'
            }
        };
    }
}
