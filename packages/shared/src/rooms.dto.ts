export interface CreateRoomBookingDto {
  userId: number;
  storeId: number;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
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
    askRefundDestination?: boolean; // you approved asking wallet vs source
  };
}
