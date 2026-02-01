import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VenuesService } from './svc.venues';

@ApiTags('venues')
@Controller('/venues')
export class VenuesController {
    constructor(private readonly svc: VenuesService) { }

    @Get('/health')
    health() {
        return { ok: true, service: 'venues', ts: new Date().toISOString() };
    }

    @Get('/catalog')
    catalog(@Query() q: any) {
        return this.svc.catalog(q);
    }

    @Get('/slots')
    slots(@Query() q: any) {
        return this.svc.listSlots(q);
    }

    @Get('/smart-slots')
    @ApiOperation({ summary: 'Generate available slots with variable pricing based on venue duration and buffer time' })
    @ApiQuery({ name: 'venue_type_id', required: true, description: 'Venue Type ID' })
    @ApiQuery({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format' })
    async getSmartSlots(
        @Query('venue_type_id') venueTypeId: string,
        @Query('date') date: string
    ) {
        return this.svc.getSmartSlots(Number(venueTypeId), date);
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
        return this.svc.getVenueById(Number(id));
    }

    @Post('/book')
    book(@Body() dto: any) {
        return this.svc.book(dto);
    }

    @Post('/cancel')
    cancel(@Body() body: { bookingId: string; userId: number }) {
        return this.svc.cancel(body.bookingId, body.userId);
    }
}
