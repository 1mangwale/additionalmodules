import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCatalog, ServiceSlot } from './typeorm/entities';
import { ServicesService } from './svc.services';

@ApiTags('services-vendor')
@Controller('/vendor/services')
export class ServicesVendorController {
  constructor(
    @InjectRepository(ServiceCatalog) private readonly catalog: Repository<ServiceCatalog>,
    @InjectRepository(ServiceSlot) private readonly slots: Repository<ServiceSlot>,
    private readonly svc: ServicesService,
  ) { }

  @Get('/catalog')
  async listCatalog() {
    return this.catalog.find({ take: 200 });
  }

  @Post('/catalog')
  async createService(@Body() body: Partial<ServiceCatalog>) {
    const item = this.catalog.create(body as any);
    return this.catalog.save(item);
  }

  @Get('/slots')
  async listSlots() {
    return this.slots.find({ take: 200 });
  }

  @Post('/slots')
  async createSlot(@Body() body: Partial<ServiceSlot>) {
    const slot = this.slots.create(body as any);
    return this.slots.save(slot);
  }

  @Delete('/slots/:id')
  async deleteSlot(@Param('id') id: string) {
    await this.slots.delete({ id: Number(id) } as any);
    return { ok: true };
  }

  @Get('/appointments')
  async getAppointments(@Query('storeId') storeId: string, @Query('status') status?: string) {
    return this.svc.getVendorAppointments(Number(storeId), status);
  }
}
