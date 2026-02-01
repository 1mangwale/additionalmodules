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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenuesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const svc_venues_1 = require("./svc.venues");
let VenuesController = class VenuesController {
    constructor(svc) {
        this.svc = svc;
    }
    health() {
        return { ok: true, service: 'venues', ts: new Date().toISOString() };
    }
    catalog(q) {
        return this.svc.catalog(q);
    }
    slots(q) {
        return this.svc.listSlots(q);
    }
    async getSmartSlots(venueTypeId, date) {
        return this.svc.getSmartSlots(Number(venueTypeId), date);
    }
    async myBookings(userId) {
        return this.svc.getUserBookings(Number(userId));
    }
    async getBooking(id) {
        return this.svc.getBookingById(id);
    }
    detail(id) {
        return this.svc.getVenueById(Number(id));
    }
    book(dto) {
        return this.svc.book(dto);
    }
    cancel(body) {
        return this.svc.cancel(body.bookingId, body.userId);
    }
};
exports.VenuesController = VenuesController;
__decorate([
    (0, common_1.Get)('/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VenuesController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('/catalog'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VenuesController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)('/slots'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VenuesController.prototype, "slots", null);
__decorate([
    (0, common_1.Get)('/smart-slots'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate available slots with variable pricing based on venue duration and buffer time' }),
    (0, swagger_1.ApiQuery)({ name: 'venue_type_id', required: true, description: 'Venue Type ID' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format' }),
    __param(0, (0, common_1.Query)('venue_type_id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "getSmartSlots", null);
__decorate([
    (0, common_1.Get)('/my-bookings'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "myBookings", null);
__decorate([
    (0, common_1.Get)('/bookings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VenuesController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('/book'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VenuesController.prototype, "book", null);
__decorate([
    (0, common_1.Post)('/cancel'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VenuesController.prototype, "cancel", null);
exports.VenuesController = VenuesController = __decorate([
    (0, swagger_1.ApiTags)('venues'),
    (0, common_1.Controller)('/venues'),
    __metadata("design:paramtypes", [svc_venues_1.VenuesService])
], VenuesController);
//# sourceMappingURL=routes.venues.js.map