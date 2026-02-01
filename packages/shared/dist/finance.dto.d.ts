export interface WalletHoldRequest {
    user_id: number;
    amount_minor: number;
    reason: string;
    idempotency_key: string;
}
export interface WalletCaptureRequest {
    user_id: number;
    amount_minor: number;
    hold_id?: string;
    reason: string;
    idempotency_key: string;
}
export interface WalletUseRequest {
    user_id: number;
    amount_minor: number;
    order_like_ref: string;
    idempotency_key: string;
}
export interface WalletRefundRequest {
    user_id: number;
    amount_minor: number;
    to: 'wallet' | 'source';
    order_like_ref: string;
    idempotency_key: string;
}
export interface MirrorOrderRequest {
    external_ref: string;
    source_system: 'nest';
    module_type: 'room' | 'service';
    zone_id: number | null;
    user_id: number;
    vendor_id: number;
    store_id: number;
    amounts: {
        subtotal_minor: number;
        tax_minor: number;
        fees_minor: number;
        commission_minor: number;
        vendor_net_minor: number;
    };
    status: string;
    metadata?: Record<string, any>;
}
