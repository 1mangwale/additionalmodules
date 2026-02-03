import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RestaurantsService } from './svc.restaurants';

@ApiTags('vendor-restaurants')
@Controller('/vendor/restaurants')
export class RestaurantsVendorController {
  constructor(private readonly svc: RestaurantsService) { }

  @Get('/bookings')
  async getBookings(@Query('store_id') storeId: string, @Query('status') status?: string) {
    return this.svc.getVendorBookings(Number(storeId), status);
  }

  @Get('/bookings/:id')
  async getBooking(@Param('id') id: string) {
    return this.svc.getBookingById(id);
  }

  @Post('/bookings/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateBookingStatus(id, body.status);
  }

  @Get('/restaurants')
  async getRestaurants(@Query('store_id') storeId: string) {
    return this.svc.searchRestaurants({ store_id: storeId });
  }

  @Get('/restaurants/:id')
  async getRestaurant(@Param('id') id: string) {
    return this.svc.getRestaurantById(Number(id));
  }
}
