export interface CreateRoomBookingDto {
    userId: number;
    storeId: number;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
    items: Array<{
        roomTypeId: number;
        ratePlanId: number;
        nights: number;
        pricePerNightMinor: number;
        taxMinor: number;
        totalMinor: number;
    }>;
    payment: {
        mode: 'prepaid' | 'partial';
        walletMinor?: number;
        gatewayMinor?: number;
        askRefundDestination?: boolean;
    };
}
