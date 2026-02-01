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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueBooking = exports.VenueSlot = exports.VenueType = void 0;
const typeorm_1 = require("typeorm");
let VenueType = class VenueType {
};
exports.VenueType = VenueType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], VenueType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VenueType.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], VenueType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], VenueType.prototype, "venue_category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VenueType.prototype, "hourly_rate_minor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], VenueType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], VenueType.prototype, "facilities", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 1 }),
    __metadata("design:type", Number)
], VenueType.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 60 }),
    __metadata("design:type", Number)
], VenueType.prototype, "session_duration_min", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 15 }),
    __metadata("design:type", Number)
], VenueType.prototype, "buffer_time_min", void 0);
exports.VenueType = VenueType = __decorate([
    (0, typeorm_1.Entity)({ name: 'venue_types' })
], VenueType);
let VenueSlot = class VenueSlot {
};
exports.VenueSlot = VenueSlot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], VenueSlot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VenueSlot.prototype, "venue_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VenueSlot.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], VenueSlot.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], VenueSlot.prototype, "hour_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], VenueSlot.prototype, "hour_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], VenueSlot.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], VenueSlot.prototype, "booked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'open' }),
    __metadata("design:type", String)
], VenueSlot.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], VenueSlot.prototype, "price_override_minor", void 0);
exports.VenueSlot = VenueSlot = __decorate([
    (0, typeorm_1.Entity)({ name: 'venue_slots' })
], VenueSlot);
let VenueBooking = class VenueBooking {
};
exports.VenueBooking = VenueBooking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VenueBooking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VenueBooking.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VenueBooking.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VenueBooking.prototype, "venue_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VenueBooking.prototype, "slot_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], VenueBooking.prototype, "booking_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], VenueBooking.prototype, "hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VenueBooking.prototype, "amount_minor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'confirmed' }),
    __metadata("design:type", String)
], VenueBooking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], VenueBooking.prototype, "payment_mode", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], VenueBooking.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => VenueType),
    (0, typeorm_1.JoinColumn)({ name: 'venue_type_id' }),
    __metadata("design:type", VenueType)
], VenueBooking.prototype, "venueType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => VenueSlot),
    (0, typeorm_1.JoinColumn)({ name: 'slot_id' }),
    __metadata("design:type", VenueSlot)
], VenueBooking.prototype, "slot", void 0);
exports.VenueBooking = VenueBooking = __decorate([
    (0, typeorm_1.Entity)({ name: 'venue_bookings' })
], VenueBooking);
//# sourceMappingURL=entities.js.map