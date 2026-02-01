import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueType, VenueSlot } from './typeorm/entities';
import { VenuesService } from './svc.venues';

@Controller('/vendor/venues')
export class VenuesVendorController {
    constructor(
        @InjectRepository(VenueType) private readonly venueTypes: Repository<VenueType>,
        @InjectRepository(VenueSlot) private readonly slots: Repository<VenueSlot>,
        private readonly svc: VenuesService,
    ) { }

    @Get('/catalog')
    async listVenues() {
        return this.venueTypes.find({ take: 200, order: { id: 'DESC' } as any });
    }

    @Post('/catalog')
    async createVenue(@Body() body: Partial<VenueType>) {
        const venue = this.venueTypes.create(body as any);
        return this.venueTypes.save(venue);
    }

    @Get('/slots')
    async listSlots() {
        return this.slots.find({ take: 200, order: { date: 'ASC', hour_start: 'ASC' } as any });
    }

    @Post('/slots')
    async createSlot(@Body() body: Partial<VenueSlot>) {
        const slot = this.slots.create(body as any);
        return this.slots.save(slot);
    }

    @Delete('/slots/:id')
    async deleteSlot(@Param('id') id: string) {
        await this.slots.delete({ id: Number(id) } as any);
        return { ok: true };
    }

    @Get('/bookings')
    async getBookings(@Query('storeId') storeId: string, @Query('status') status?: string) {
        return this.svc.getVendorBookings(Number(storeId), status);
    }
}
