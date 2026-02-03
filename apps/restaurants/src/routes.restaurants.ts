import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RestaurantsService } from './svc.restaurants';
import { CreateTableBookingDto } from './dto';

@ApiTags('restaurants')
@Controller('/restaurants')
export class RestaurantsController {
  constructor(private readonly svc: RestaurantsService) { }

  @Get('/health')
  health() {
    return { ok: true, service: 'restaurants' };
  }

  @Get('/search')
  search(@Query() q: any) {
    return this.svc.searchRestaurants(q);
  }

  @Get('/tables/search')
  searchTables(@Query() q: any) {
    return this.svc.searchAvailableTables(q);
  }

  @Get('/my-bookings')
  async myBookings(@Query('userId') userId: string) {
    return this.svc.getUserBookings(Number(userId));
  }

  @Get('/bookings/:id')
  async getBooking(@Param('id') id: string) {
    return this.svc.getBookingById(id);
  }

  @Get('/:id')
  detail(@Param('id') id: string) {
    return this.svc.getRestaurantById(Number(id));
  }

  @Post('/book')
  book(@Body() dto: CreateTableBookingDto) {
    return this.svc.book(dto);
  }

  @Post('/cancel')
  cancel(@Body() body: { bookingId: string; userId?: number }) {
    return this.svc.cancel(body.bookingId, body.userId);
  }

  @Post('/bookings/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateBookingStatus(id, body.status);
  }
}
