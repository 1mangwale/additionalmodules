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
exports.RoomInventory = exports.RoomRatePlan = exports.RoomType = void 0;
const typeorm_1 = require("typeorm");
let RoomType = class RoomType {
};
exports.RoomType = RoomType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], RoomType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], RoomType.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], RoomType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 2 }),
    __metadata("design:type", Number)
], RoomType.prototype, "occupancy_adults", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], RoomType.prototype, "occupancy_children", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RoomType.prototype, "amenities", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 1 }),
    __metadata("design:type", Number)
], RoomType.prototype, "status", void 0);
exports.RoomType = RoomType = __decorate([
    (0, typeorm_1.Entity)({ name: 'room_types' })
], RoomType);
let RoomRatePlan = class RoomRatePlan {
};
exports.RoomRatePlan = RoomRatePlan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], RoomRatePlan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], RoomRatePlan.prototype, "room_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], RoomRatePlan.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], RoomRatePlan.prototype, "refundable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RoomRatePlan.prototype, "refund_policy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'flat' }),
    __metadata("design:type", String)
], RoomRatePlan.prototype, "pricing_mode", void 0);
exports.RoomRatePlan = RoomRatePlan = __decorate([
    (0, typeorm_1.Entity)({ name: 'room_rate_plans' })
], RoomRatePlan);
let RoomInventory = class RoomInventory {
};
exports.RoomInventory = RoomInventory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], RoomInventory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], RoomInventory.prototype, "room_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], RoomInventory.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RoomInventory.prototype, "total_rooms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], RoomInventory.prototype, "sold_rooms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Object)
], RoomInventory.prototype, "cutoff_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], RoomInventory.prototype, "price_override", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'open' }),
    __metadata("design:type", String)
], RoomInventory.prototype, "status", void 0);
exports.RoomInventory = RoomInventory = __decorate([
    (0, typeorm_1.Entity)({ name: 'room_inventory' })
], RoomInventory);
//# sourceMappingURL=entities.js.map