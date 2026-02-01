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
exports.VendorPricingSlab = void 0;
const typeorm_1 = require("typeorm");
let VendorPricingSlab = class VendorPricingSlab {
};
exports.VendorPricingSlab = VendorPricingSlab;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], VendorPricingSlab.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], VendorPricingSlab.prototype, "vendor_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], VendorPricingSlab.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], VendorPricingSlab.prototype, "zone_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], VendorPricingSlab.prototype, "module", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], VendorPricingSlab.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], VendorPricingSlab.prototype, "basis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], VendorPricingSlab.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Object)
], VendorPricingSlab.prototype, "range_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Object)
], VendorPricingSlab.prototype, "range_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 3, nullable: true }),
    __metadata("design:type", Object)
], VendorPricingSlab.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', array: true, nullable: true }),
    __metadata("design:type", Object)
], VendorPricingSlab.prototype, "weekdays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], VendorPricingSlab.prototype, "date_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], VendorPricingSlab.prototype, "date_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 100 }),
    __metadata("design:type", Number)
], VendorPricingSlab.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], VendorPricingSlab.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'price' }),
    __metadata("design:type", String)
], VendorPricingSlab.prototype, "tag", void 0);
exports.VendorPricingSlab = VendorPricingSlab = __decorate([
    (0, typeorm_1.Entity)({ name: 'vendor_pricing_slabs' })
], VendorPricingSlab);
//# sourceMappingURL=vendor-pricing-slab.entity.js.map