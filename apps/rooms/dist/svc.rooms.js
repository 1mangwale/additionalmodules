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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("./typeorm/entities");
function idemp(key) {
    return { headers: { 'Idempotency-Key': key } };
}
let RoomsService = class RoomsService {
    constructor(roomTypes, inventory) {
        this.roomTypes = roomTypes;
        this.inventory = inventory;
    }
    async searchRooms(q) {
        const where = {};
        if (q.store_id)
            where.store_id = Number(q.store_id);
        if (q.adults)
            where.occupancy_adults = Number(q.adults);
        const items = await this.roomTypes.find({ where, take: 100, order: { id: 'DESC' } });
        return { items, total: items.length };
    }
    async getRoomById(id) {
        const room = await this.roomTypes.findOne({ where: { id } });
        if (!room)
            return { message: 'Not Found', status: 404 };
        return room;
    }
    async price(body) {
        const PRICING = process.env.PRICING_BASE_URL || 'http://localhost:4003';
        const payload = {
            module: 'room',
            storeId: Number(body.storeId || 1),
            inputs: {
                checkIn: body.checkIn || body.checkin,
                checkOut: body.checkOut || body.checkout,
                nights: body.nights || 1,
                roomTypeId: body.roomTypeId || body.room_type_id,
                ratePlanId: body.ratePlanId || body.rate_plan_id,
            },
        };
        try {
            const r = await axios_1.default.post(`${PRICING}/pricing/quote`, payload);
            return r.data;
        }
        catch {
            return { currency: 'INR', lines: [], total_minor: 0 };
        }
    }
    async book(dto) {
        // 1) persist booking in PG (skipped here for brevity — stub success)
        const bookingId = node_crypto_1.default.randomUUID();
        // 2) Collect funds via v1 (Finance Bridge endpoints)
        const V1 = process.env.V1_BASE_URL || 'http://localhost:8080';
        const userId = dto.userId;
        const items = Array.isArray(dto.items) ? dto.items : [];
        const total = items.reduce((s, it) => s + (it.totalMinor || 0), 0);
        const financeMock = String(process.env.FINANCE_MOCK || process.env.NODE_ENV === 'development') === 'true' || process.env.NODE_ENV === 'development';
        const mockOk = async (_) => ({ data: { ok: true } });
        const postOrMock = async (url, payload, headers) => {
            if (financeMock)
                return mockOk(payload);
            return axios_1.default.post(url, payload, headers);
        };
        if (dto.payment.mode === 'prepaid' || dto.payment.mode === 'partial') {
            if (dto.payment.walletMinor && dto.payment.walletMinor > 0) {
                await postOrMock(`${V1}/internal/wallet/use`, {
                    user_id: userId,
                    amount_minor: dto.payment.walletMinor,
                    order_like_ref: bookingId,
                    idempotency_key: `booking:${bookingId}:wallet`,
                }, idemp(`booking:${bookingId}:wallet`));
            }
            const gatewayMinor = dto.payment.gatewayMinor || 0;
            if (gatewayMinor > 0) {
                await postOrMock(`${V1}/internal/wallet/capture`, {
                    user_id: userId,
                    amount_minor: gatewayMinor,
                    reason: 'room_prepaid',
                    idempotency_key: `booking:${bookingId}:capture`,
                }, idemp(`booking:${bookingId}:capture`));
            }
        }
        // 3) Mirror order in v1 for settlement (numbers are examples; compute real totals)
        await postOrMock(`${V1}/internal/orders/mirror`, {
            external_ref: bookingId,
            source_system: 'nest',
            module_type: 'room',
            zone_id: null,
            user_id: userId,
            vendor_id: dto.storeId, // adjust if needed
            store_id: dto.storeId,
            amounts: {
                subtotal_minor: total,
                tax_minor: 0,
                fees_minor: 0,
                commission_minor: Math.round(total * 0.1),
                vendor_net_minor: Math.round(total * 0.9),
            },
            status: 'confirmed',
            metadata: { check_in: dto.checkIn, check_out: dto.checkOut },
        }, idemp(`booking:${bookingId}:mirror`));
        return { bookingId, status: 'confirmed' };
    }
    async cancel(bookingId, askRefundDestination) {
        // Compute refund via slabs (TODO); for demo, refund everything to wallet
        const refundMinor = 100;
        const V1 = process.env.V1_BASE_URL || 'http://localhost:8080';
        const financeMock = String(process.env.FINANCE_MOCK || process.env.NODE_ENV === 'development') === 'true' || process.env.NODE_ENV === 'development';
        const postOrMock = async (url, payload, headers) => {
            if (financeMock)
                return { data: { ok: true } };
            return axios_1.default.post(url, payload, headers);
        };
        await postOrMock(`${V1}/internal/wallet/refund`, {
            user_id: 0,
            amount_minor: refundMinor,
            to: askRefundDestination ? 'wallet' : 'source',
            order_like_ref: bookingId,
            idempotency_key: `booking:${bookingId}:refund`,
        }, idemp(`booking:${bookingId}:refund`));
        return { bookingId, refunded_minor: refundMinor };
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.RoomType)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.RoomInventory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RoomsService);
//# sourceMappingURL=svc.rooms.js.map