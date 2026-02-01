export type PricingModule = 'room' | 'service';
export interface PriceLine {
    tag: 'price' | 'visit_fee' | 'refund_penalty' | 'commission' | 'tax' | 'misc';
    description?: string;
    amount_minor: number;
}
export interface PricingQuoteRequest {
    module: PricingModule;
    storeId: number;
    userId?: number;
    inputs: {
        checkIn?: string;
        checkOut?: string;
        nights?: number;
        roomTypeId?: number;
        ratePlanId?: number;
        serviceId?: number;
        date?: string;
        startTime?: string;
        distanceKm?: number;
        hour?: number;
        leadTimeHours?: number;
    };
    couponCode?: string;
}
export interface PricingQuoteResponse {
    currency: 'INR';
    lines: PriceLine[];
    total_minor: number;
    meta?: Record<string, any>;
}
