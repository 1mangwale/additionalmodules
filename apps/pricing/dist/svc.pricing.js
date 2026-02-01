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
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const vendor_pricing_slab_entity_1 = require("./typeorm/vendor-pricing-slab.entity");
function addLine(lines, tag, amt, description) {
    if (amt === 0)
        return;
    lines.push({ tag, amount_minor: Math.round(amt), description });
}
let PricingService = class PricingService {
    constructor(repo) {
        this.repo = repo;
    }
    async quote(req) {
        const slabs = await this.repo.find({
            where: { module: req.module, active: true },
            order: { priority: 'ASC', id: 'ASC' },
        });
        const lines = [];
        let total = 0;
        // Base price – you may fetch from catalog/room types; for starter we use 0 baseline.
        let baseMinor = 0;
        // Evaluate slabs (very simplified demo logic)
        for (const s of slabs) {
            // Basis filtering stubs. Extend with real matching.
            const now = new Date();
            const basis = s.basis;
            const tag = s.tag;
            const method = s.method;
            // Example matches (fill properly later):
            const matches = true;
            if (!matches)
                continue;
            // Determine unit amount
            let delta = 0;
            if (method === 'flat')
                delta = Number(s.value || 0) * 100;
            if (method === 'percent')
                delta = Math.round((Number(s.value || 0) / 100) * baseMinor);
            if (method === 'per_unit') {
                const units = 1; // e.g., distance km or hours
                delta = Math.round(units * Number(s.value || 0) * 100);
            }
            if (tag === 'price') {
                addLine(lines, 'price', delta, s.name);
                total += delta;
            }
            else if (tag === 'visit_fee') {
                addLine(lines, 'visit_fee', delta, s.name);
                total += delta;
            }
            else if (tag === 'refund_penalty') {
                // Represent penalty as a negative number in payable context (info only). Real penalty is applied on cancel.
                addLine(lines, 'refund_penalty', delta, s.name);
            }
            else if (tag === 'commission') {
                addLine(lines, 'commission', delta, s.name);
                total += delta;
            }
        }
        // Taxes (demo 0). In real use, apply GST here and push as a 'tax' line.
        return { currency: 'INR', lines, total_minor: Math.max(0, total) };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(vendor_pricing_slab_entity_1.VendorPricingSlab)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PricingService);
//# sourceMappingURL=svc.pricing.js.map