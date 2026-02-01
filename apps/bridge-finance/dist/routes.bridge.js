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
exports.BridgeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const finance_client_1 = require("./finance.client");
let BridgeController = class BridgeController {
    constructor(f) {
        this.f = f;
    }
    async ping() {
        return { ok: true };
    }
    async demoHold(body) {
        return this.f.hold(body, body.idempotency_key || 'demo:hold');
    }
};
exports.BridgeController = BridgeController;
__decorate([
    (0, common_1.Post)('/ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BridgeController.prototype, "ping", null);
__decorate([
    (0, common_1.Post)('/demo/hold'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BridgeController.prototype, "demoHold", null);
exports.BridgeController = BridgeController = __decorate([
    (0, swagger_1.ApiTags)('bridge'),
    (0, common_1.Controller)('/bridge'),
    __metadata("design:paramtypes", [finance_client_1.FinanceClient])
], BridgeController);
//# sourceMappingURL=routes.bridge.js.map