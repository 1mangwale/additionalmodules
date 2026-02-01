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
exports.RoomsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const svc_rooms_1 = require("./svc.rooms");
let RoomsController = class RoomsController {
    constructor(svc) {
        this.svc = svc;
    }
    health() {
        return { ok: true };
    }
    search(q) {
        return this.svc.searchRooms(q);
    }
    detail(id) {
        return this.svc.getRoomById(Number(id));
    }
    price(body) {
        return this.svc.price(body);
    }
    book(dto) {
        return this.svc.book(dto);
    }
    cancel(body) {
        return this.svc.cancel(body.bookingId, body.askRefundDestination ?? true);
    }
};
exports.RoomsController = RoomsController;
__decorate([
    (0, common_1.Get)('/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('/search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('/price'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "price", null);
__decorate([
    (0, common_1.Post)('/book'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "book", null);
__decorate([
    (0, common_1.Post)('/cancel'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "cancel", null);
exports.RoomsController = RoomsController = __decorate([
    (0, swagger_1.ApiTags)('rooms'),
    (0, common_1.Controller)('/rooms'),
    __metadata("design:paramtypes", [svc_rooms_1.RoomsService])
], RoomsController);
//# sourceMappingURL=routes.rooms.js.map