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
exports.RoomsVendorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("./typeorm/entities");
let RoomsVendorController = class RoomsVendorController {
    constructor(roomTypes, inventory) {
        this.roomTypes = roomTypes;
        this.inventory = inventory;
    }
    async listRoomTypes() {
        return this.roomTypes.find({ take: 100 });
    }
    async createRoomType(body) {
        const rt = this.roomTypes.create(body);
        return this.roomTypes.save(rt);
    }
    async listInventory() {
        return this.inventory.find({ take: 200 });
    }
    async upsertInventory(body) {
        const inv = this.inventory.create(body);
        return this.inventory.save(inv);
    }
};
exports.RoomsVendorController = RoomsVendorController;
__decorate([
    (0, common_1.Get)('/room-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoomsVendorController.prototype, "listRoomTypes", null);
__decorate([
    (0, common_1.Post)('/room-types'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RoomsVendorController.prototype, "createRoomType", null);
__decorate([
    (0, common_1.Get)('/inventory'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoomsVendorController.prototype, "listInventory", null);
__decorate([
    (0, common_1.Post)('/inventory'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RoomsVendorController.prototype, "upsertInventory", null);
exports.RoomsVendorController = RoomsVendorController = __decorate([
    (0, swagger_1.ApiTags)('rooms-vendor'),
    (0, common_1.Controller)('/vendor/rooms'),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.RoomType)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.RoomInventory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RoomsVendorController);
//# sourceMappingURL=vendor.routes.js.map