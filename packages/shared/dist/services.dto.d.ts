export interface CreateServiceAppointmentDto {
    userId: number;
    storeId: number;
    serviceId: number;
    addressId?: number;
    scheduledFor: string;
    slotId?: number;
    pricing: {
        baseMinor: number;
        visitFeeMinor: number;
        taxMinor: number;
        depositMinor?: number;
    };
    payment: {
        mode: 'prepaid' | 'deposit' | 'postpaid';
        walletMinor?: number;
        gatewayMinor?: number;
    };
}
