export type PricingModule = 'room' | 'service';

export interface PriceLine {
  tag: 'price' | 'visit_fee' | 'refund_penalty' | 'commission' | 'tax' | 'misc';
  description?: string;
  amount_minor: number; // positive adds to payable, negative subtracts
}

export interface PricingQuoteRequest {
  module: PricingModule;
  storeId: number;
  userId?: number;
  inputs: {
    // Rooms
    checkIn?: string;  // YYYY-MM-DD
    checkOut?: string; // YYYY-MM-DD
    nights?: number;
    roomTypeId?: number;
    ratePlanId?: number;

    // Services
    serviceId?: number;
    date?: string;       // YYYY-MM-DD
    startTime?: string;  // HH:mm
    distanceKm?: number; // for visit fee slabs
    hour?: number;       // 0-23 for hourly slabs
    leadTimeHours?: number;
  };
  // Optional coupon/credits flags resolved elsewhere
  couponCode?: string;
}

export interface PricingQuoteResponse {
  currency: 'INR';
  lines: PriceLine[];
  total_minor: number;
  meta?: Record<string, any>;
}
