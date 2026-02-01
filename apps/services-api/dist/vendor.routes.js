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
exports.ServicesVendorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("./typeorm/entities");
const svc_services_1 = require("./svc.services");
let ServicesVendorController = class ServicesVendorController {
    constructor(catalog, slots, svc) {
        this.catalog = catalog;
        this.slots = slots;
        this.svc = svc;
    }
    async listCatalog() {
        return this.catalog.find({ take: 200 });
    }
    async createService(body) {
        const item = this.catalog.create(body);
        return this.catalog.save(item);
    }
    async listSlots() {
        return this.slots.find({ take: 200 });
    }
    async createSlot(body) {
        const slot = this.slots.create(body);
        return this.slots.save(slot);
    }
    async deleteSlot(id) {
        await this.slots.delete({ id: Number(id) });
        return { ok: true };
    }
    async getAppointments(storeId, status) {
        return this.svc.getVendorAppointments(Number(storeId), status);
    }
};
exports.ServicesVendorController = ServicesVendorController;
__decorate([
    (0, common_1.Get)('/catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ServicesVendorController.prototype, "listCatalog", null);
__decorate([
    (0, common_1.Post)('/catalog'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServicesVendorController.prototype, "createService", null);
__decorate([
    (0, common_1.Get)('/slots'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ServicesVendorController.prototype, "listSlots", null);
__decorate([
    (0, common_1.Post)('/slots'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServicesVendorController.prototype, "createSlot", null);
__decorate([
    (0, common_1.Delete)('/slots/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServicesVendorController.prototype, "deleteSlot", null);
__decorate([
    (0, common_1.Get)('/appointments'),
    __param(0, (0, common_1.Query)('storeId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ServicesVendorController.prototype, "getAppointments", null);
exports.ServicesVendorController = ServicesVendorController = __decorate([
    (0, swagger_1.ApiTags)('services-vendor'),
    (0, common_1.Controller)('/vendor/services'),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.ServiceCatalog)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ServiceSlot)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        svc_services_1.ServicesService])
], ServicesVendorController);
//# sourceMappingURL=vendor.routes.js.map