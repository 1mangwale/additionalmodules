export interface CreateTableBookingDto {
  userId: number;
  storeId: number;
  restaurantId: number;
  tableTypeId: number;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:MM
  partySize: number;
  durationMinutes?: number;
  customerName?: string;
  customerPhone?: string;
  specialRequests?: string;
  payment?: {
    mode: 'prepaid' | 'at-venue';
    walletMinor?: number;
    gatewayMinor?: number;
  };
}

export interface SearchRestaurantsQuery {
  store_id?: number;
  cuisine_type?: string;
  status?: string;
}

export interface SearchTablesQuery {
  restaurant_id: number;
  date: string;
  time: string;
  party_size: number;
}
