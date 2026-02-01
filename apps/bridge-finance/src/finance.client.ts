import axios, { AxiosInstance } from 'axios';

export class FinanceClient {
  private http: AxiosInstance;

  constructor() {
    const baseURL = process.env.V1_BASE_URL || 'http://localhost:8080';
    const token = process.env.V1_AUTH_TOKEN || 'dev-token';
    this.http = axios.create({
      baseURL,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
  }

  async hold(data: any, idem: string) {
    return this.http.post('/internal/wallet/hold', data, { headers: { 'Idempotency-Key': idem } });
  }
  async capture(data: any, idem: string) {
    return this.http.post('/internal/wallet/capture', data, { headers: { 'Idempotency-Key': idem } });
  }
  async use(data: any, idem: string) {
    return this.http.post('/internal/wallet/use', data, { headers: { 'Idempotency-Key': idem } });
  }
  async refund(data: any, idem: string) {
    return this.http.post('/internal/wallet/refund', data, { headers: { 'Idempotency-Key': idem } });
  }
  async mirrorOrder(data: any, idem: string) {
    return this.http.post('/internal/orders/mirror', data, { headers: { 'Idempotency-Key': idem } });
  }
  async vendorAccrue(data: any, idem: string) {
    return this.http.post('/internal/vendor/accrue', data, { headers: { 'Idempotency-Key': idem } });
  }
}
