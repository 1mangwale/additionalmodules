"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenuesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("./typeorm/entities");
const shared_1 = require("@mangwale/shared");
const axios_1 = __importDefault(require("axios"));
function idemp(key) {
    return { headers: { 'Idempotency-Key': key } };
}
let VenuesService = class VenuesService {
    constructor(venueTypes, slots, bookings) {
        this.venueTypes = venueTypes;
        this.slots = slots;
        this.bookings = bookings;
    }
    async catalog(q) {
        const where = {};
        if (q.store_id)
            where.store_id = Number(q.store_id);
        if (q.venue_category)
            where.venue_category = q.venue_category;
        const items = await this.venueTypes.find({ where, take: 100, order: { id: 'DESC' } });
        return { items, total: items.length };
    }
    async getVenueById(id) {
        const venue = await this.venueTypes.findOne({ where: { id } });
        if (!venue) {
            throw new common_1.NotFoundException('Venue not found');
        }
        return venue;
    }
    async listSlots(q) {
        const where = {};
        if (q.store_id)
            where.store_id = Number(q.store_id);
        if (q.venue_type_id)
            where.venue_type_id = Number(q.venue_type_id);
        if (q.date)
            where.date = String(q.date);
        const items = await this.slots.find({ where, take: 200, order: { date: 'ASC', hour_start: 'ASC' } });
        return { items, total: items.length };
    }
    async book(dto) {
        // 1) Validate slot exists and is available
        const slot = await this.slots.findOne({ where: { id: dto.slotId } });
        if (!slot) {
            throw new common_1.NotFoundException('Slot not found');
        }
        if (slot.status !== 'open') {
            throw new common_1.BadRequestException('Slot is not available');
        }
        if (slot.booked >= slot.capacity) {
            throw new common_1.BadRequestException('Slot is fully booked');
        }
        // 2) Validate venue exists
        const venue = await this.venueTypes.findOne({ where: { id: dto.venueTypeId } });
        if (!venue) {
            throw new common_1.NotFoundException('Venue not found');
        }
        // 3) Calculate amount
        const amountMinor = dto.amountMinor || (dto.pricing ? dto.pricing.baseMinor + (dto.pricing.taxMinor || 0) : 0);
        const hours = dto.hours || (slot.hour_end - slot.hour_start);
        // 4) Create booking
        const booking = this.bookings.create({
            user_id: dto.userId,
            store_id: dto.storeId,
            venue_type_id: dto.venueTypeId,
            slot_id: dto.slotId,
            booking_date: dto.date || slot.date,
            hours: hours,
            amount_minor: amountMinor,
            status: 'confirmed',
            payment_mode: dto.payment.mode,
        });
        await this.bookings.save(booking);
        // 5) Increment booked count
        await this.slots.increment({ id: dto.slotId }, 'booked', 1);
        // 6) Process payment
        const financeUrl = process.env.FINANCE_URL || 'http://localhost:4004';
        try {
            await axios_1.default.post(`${financeUrl}/finance/charge`, {
                userId: dto.userId,
                orderId: booking.id,
                amountMinor: dto.amountMinor,
                payment: dto.payment,
            }, idemp(booking.id));
        }
        catch (err) {
            console.error('Finance charge failed:', err.message);
        }
        return { bookingId: booking.id, status: 'confirmed' };
    }
    async cancel(bookingId, userId) {
        // 1) Find booking
        const booking = await this.bookings.findOne({
            where: { id: bookingId, user_id: userId },
            relations: ['slot'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status === 'cancelled') {
            throw new common_1.BadRequestException('Booking already cancelled');
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
        }
        else if (hoursUntil >= 6) {
            // 50% refund if cancelled 6-24 hours before
            refundMinor = Math.floor(booking.amount_minor * 0.5);
        }
        else {
            // No refund if < 6 hours before
            refundMinor = 0;
        }
        // 3) Update booking status
        booking.status = 'cancelled';
        await this.bookings.save(booking);
        // 4) Restore slot availability
        await this.slots.decrement({ id: booking.slot_id }, 'booked', 1);
        // 5) Process refund
        if (refundMinor > 0) {
            const financeUrl = process.env.FINANCE_URL || 'http://localhost:4004';
            try {
                await axios_1.default.post(`${financeUrl}/finance/refund`, {
                    userId: booking.user_id,
                    orderId: booking.id,
                    amountMinor: refundMinor,
                }, idemp(`${booking.id}-refund`));
            }
            catch (err) {
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
    async getUserBookings(userId) {
        const bookings = await this.bookings.find({
            where: { user_id: userId },
            relations: ['venueType', 'slot'],
            order: { created_at: 'DESC' },
            take: 100,
        });
        return { bookings, total: bookings.length };
    }
    async getVendorBookings(storeId, status) {
        const where = { store_id: storeId };
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
    async getBookingById(id) {
        const booking = await this.bookings.findOne({
            where: { id },
            relations: ['venueType', 'slot'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return booking;
    }
    /**
     * Generate smart slots based on venue session duration and buffer time
     * Supports variable pricing for peak/off-peak hours
     */
    async getSmartSlots(venueTypeId, date) {
        // 1. Get venue type details from database
        const venue = await this.venueTypes.findOne({
            where: { id: venueTypeId }
        });
        if (!venue) {
            throw new common_1.NotFoundException('Venue not found');
        }
        if (!venue.session_duration_min) {
            throw new common_1.BadRequestException('Venue session duration not configured. Please set session_duration_min in the database.');
        }
        // 2. Get working hours for venues (6 AM - 10 PM for sports venues)
        const workingHours = (0, shared_1.getDefaultWorkingHours)('venues');
        // 3. Get existing bookings for this venue on this date from database
        const existingBookings = await this.bookings.find({
            where: {
                venue_type_id: venueTypeId,
                booking_date: date
            },
            relations: ['slot']
        });
        // 4. Convert to format expected by slot generator
        const bookedSlots = existingBookings.map(booking => ({
            start_time: `${booking.slot?.hour_start || 9}:00`,
            duration_min: venue.session_duration_min,
            buffer_min: venue.buffer_time_min || 15
        }));
        // 5. Define peak hour pricing (read from database in future)
        const pricingRules = {
            peak_hours: [
                { start: '06:00', end: '09:00', multiplier: 1.5 }, // Morning peak
                { start: '17:00', end: '22:00', multiplier: 1.5 }, // Evening peak
            ]
        };
        // 6. Generate slots with pricing using shared service
        const basePrice = Number(venue.hourly_rate_minor) / 100;
        const slots = (0, shared_1.generateAvailableSlotsWithPricing)({
            duration_min: venue.session_duration_min,
            buffer_time_min: venue.buffer_time_min || 15,
            base_price: basePrice,
            id: venue.id,
            name: venue.name
        }, workingHours, bookedSlots, pricingRules);
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
                peak_price: basePrice * 1.5,
                peak_hours: '6-9 AM, 5-10 PM'
            }
        };
    }
};
exports.VenuesService = VenuesService;
exports.VenuesService = VenuesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.VenueType)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.VenueSlot)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.VenueBooking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], VenuesService);
//# sourceMappingURL=svc.venues.js.map