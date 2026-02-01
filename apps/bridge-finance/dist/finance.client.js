"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceClient = void 0;
const axios_1 = __importDefault(require("axios"));
class FinanceClient {
    constructor() {
        const baseURL = process.env.V1_BASE_URL || 'http://localhost:8080';
        const token = process.env.V1_AUTH_TOKEN || 'dev-token';
        this.http = axios_1.default.create({
            baseURL,
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
        });
    }
    async hold(data, idem) {
        return this.http.post('/internal/wallet/hold', data, { headers: { 'Idempotency-Key': idem } });
    }
    async capture(data, idem) {
        return this.http.post('/internal/wallet/capture', data, { headers: { 'Idempotency-Key': idem } });
    }
    async use(data, idem) {
        return this.http.post('/internal/wallet/use', data, { headers: { 'Idempotency-Key': idem } });
    }
    async refund(data, idem) {
        return this.http.post('/internal/wallet/refund', data, { headers: { 'Idempotency-Key': idem } });
    }
    async mirrorOrder(data, idem) {
        return this.http.post('/internal/orders/mirror', data, { headers: { 'Idempotency-Key': idem } });
    }
    async vendorAccrue(data, idem) {
        return this.http.post('/internal/vendor/accrue', data, { headers: { 'Idempotency-Key': idem } });
    }
}
exports.FinanceClient = FinanceClient;
//# sourceMappingURL=finance.client.js.map