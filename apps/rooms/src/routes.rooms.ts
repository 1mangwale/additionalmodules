import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoomsService } from './svc.rooms';
import { CreateRoomBookingDto } from './dto';

@ApiTags('rooms')
@Controller('/rooms')
export class RoomsController {
  constructor(private readonly svc: RoomsService) { }

  @Get('/health')
  health() {
    return { ok: true };
  }

  @Get('/search')
  search(@Query() q: any) {
    return this.svc.searchRooms(q);
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
    return this.svc.getRoomById(Number(id));
  }

  @Post('/price')
  price(@Body() body: any) {
    return this.svc.price(body);
  }

  @Post('/book')
  book(@Body() dto: CreateRoomBookingDto) {
    return this.svc.book(dto);
  }

  @Post('/cancel')
  cancel(@Body() body: { bookingId: string; askRefundDestination?: boolean }) {
    return this.svc.cancel(body.bookingId, body.askRefundDestination ?? true);
  }
}
