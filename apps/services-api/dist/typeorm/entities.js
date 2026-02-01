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
exports.ServiceAppointment = exports.VendorStore = exports.ServiceSlot = exports.ServiceCatalog = void 0;
const typeorm_1 = require("typeorm");
let ServiceCatalog = class ServiceCatalog {
};
exports.ServiceCatalog = ServiceCatalog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], ServiceCatalog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], ServiceCatalog.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ServiceCatalog.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceCatalog.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceCatalog.prototype, "parent_category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'dynamic' }),
    __metadata("design:type", String)
], ServiceCatalog.prototype, "pricing_model", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], ServiceCatalog.prototype, "base_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], ServiceCatalog.prototype, "visit_fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ServiceCatalog.prototype, "at_customer_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 1 }),
    __metadata("design:type", Number)
], ServiceCatalog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ServiceCatalog.prototype, "duration_min", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 15 }),
    __metadata("design:type", Number)
], ServiceCatalog.prototype, "buffer_time_min", void 0);
exports.ServiceCatalog = ServiceCatalog = __decorate([
    (0, typeorm_1.Entity)({ name: 'services_catalog' })
], ServiceCatalog);
let ServiceSlot = class ServiceSlot {
};
exports.ServiceSlot = ServiceSlot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], ServiceSlot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], ServiceSlot.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ServiceSlot.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'start_time' }),
    __metadata("design:type", String)
], ServiceSlot.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'end_time' }),
    __metadata("design:type", String)
], ServiceSlot.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], ServiceSlot.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ServiceSlot.prototype, "booked", void 0);
exports.ServiceSlot = ServiceSlot = __decorate([
    (0, typeorm_1.Entity)({ name: 'service_slots' })
], ServiceSlot);
let VendorStore = class VendorStore {
};
exports.VendorStore = VendorStore;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], VendorStore.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VendorStore.prototype, "vendor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VendorStore.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], VendorStore.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], VendorStore.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], VendorStore.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 8, scale: 2, default: 15.0 }),
    __metadata("design:type", String)
], VendorStore.prototype, "service_radius_km", void 0);
exports.VendorStore = VendorStore = __decorate([
    (0, typeorm_1.Entity)({ name: 'vendor_stores' })
], VendorStore);
let ServiceAppointment = class ServiceAppointment {
};
exports.ServiceAppointment = ServiceAppointment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ServiceAppointment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], ServiceAppointment.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], ServiceAppointment.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], ServiceAppointment.prototype, "service_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], ServiceAppointment.prototype, "slot_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ServiceAppointment.prototype, "scheduled_for", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], ServiceAppointment.prototype, "address_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'pending' }),
    __metadata("design:type", String)
], ServiceAppointment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceAppointment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], ServiceAppointment.prototype, "base_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], ServiceAppointment.prototype, "visit_fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], ServiceAppointment.prototype, "tax_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ServiceAppointment.prototype, "final_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'prepaid' }),
    __metadata("design:type", String)
], ServiceAppointment.prototype, "payment_mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ServiceAppointment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ServiceAppointment.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ServiceCatalog),
    (0, typeorm_1.JoinColumn)({ name: 'service_id' }),
    __metadata("design:type", ServiceCatalog)
], ServiceAppointment.prototype, "service", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ServiceSlot),
    (0, typeorm_1.JoinColumn)({ name: 'slot_id' }),
    __metadata("design:type", ServiceSlot)
], ServiceAppointment.prototype, "slot", void 0);
exports.ServiceAppointment = ServiceAppointment = __decorate([
    (0, typeorm_1.Entity)({ name: 'service_appointments' })
], ServiceAppointment);
//# sourceMappingURL=entities.js.map