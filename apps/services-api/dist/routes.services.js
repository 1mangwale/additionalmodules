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
exports.ServicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const svc_services_1 = require("./svc.services");
let ServicesController = class ServicesController {
    constructor(svc) {
        this.svc = svc;
    }
    health() {
        return { ok: true, service: 'services-api', ts: new Date().toISOString() };
    }
    catalog(q) {
        return this.svc.catalog(q);
    }
    slots(q) { return this.svc.slots(q); }
    async getSmartSlots(serviceId, date, storeId) {
        return this.svc.getSmartSlots(Number(serviceId), date, Number(storeId));
    }
    detail(id) { return this.svc.getServiceById(Number(id)); }
    book(dto) {
        return this.svc.book(dto);
    }
    complete(body) {
        return this.svc.complete(body.jobId, body.additionsMinor || 0);
    }
    cancel(body) {
        return this.svc.cancel(body.jobId, body.askRefundDestination ?? true);
    }
    async myAppointments(userId) {
        return this.svc.getUserAppointments(Number(userId));
    }
    async getAppointment(id) {
        return this.svc.getAppointmentById(id);
    }
};
exports.ServicesController = ServicesController;
__decorate([
    (0, common_1.Get)('/health'),
    (0, swagger_1.ApiOperation)({ summary: 'Health check' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('/catalog'),
    (0, swagger_1.ApiOperation)({ summary: 'List services catalog' }),
    (0, swagger_1.ApiQuery)({ name: 'store_id', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)('/slots'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "slots", null);
__decorate([
    (0, common_1.Get)('/smart-slots'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate available slots based on service duration and buffer time' }),
    (0, swagger_1.ApiQuery)({ name: 'service_id', required: true, description: 'Service ID' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format' }),
    (0, swagger_1.ApiQuery)({ name: 'store_id', required: true, description: 'Store/Vendor ID' }),
    __param(0, (0, common_1.Query)('service_id')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('store_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "getSmartSlots", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('/book'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "book", null);
__decorate([
    (0, common_1.Post)('/complete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)('/cancel'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('my-appointments'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "myAppointments", null);
__decorate([
    (0, common_1.Get)('appointments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "getAppointment", null);
exports.ServicesController = ServicesController = __decorate([
    (0, swagger_1.ApiTags)('services'),
    (0, common_1.Controller)('/services'),
    __metadata("design:paramtypes", [svc_services_1.ServicesService])
], ServicesController);
//# sourceMappingURL=routes.services.js.map