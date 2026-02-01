import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ServicesService } from './svc.services';
import { CreateServiceAppointmentDto } from '@mangwale/shared';

@ApiTags('services')
@Controller('/services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) { }

  @Get('/health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { ok: true, service: 'services-api', ts: new Date().toISOString() };
  }

  @Get('/catalog')
  @ApiOperation({ summary: 'List services catalog' })
  @ApiQuery({ name: 'store_id', required: false })
  catalog(@Query() q: any) {
    return this.svc.catalog(q);
  }

  @Get('/slots')
  slots(@Query() q: any) { return this.svc.slots(q); }

  @Get('/smart-slots')
  @ApiOperation({ summary: 'Generate available slots based on service duration and buffer time' })
  @ApiQuery({ name: 'service_id', required: true, description: 'Service ID' })
  @ApiQuery({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'store_id', required: true, description: 'Store/Vendor ID' })
  async getSmartSlots(
    @Query('service_id') serviceId: string,
    @Query('date') date: string,
    @Query('store_id') storeId: string
  ) {
    return this.svc.getSmartSlots(Number(serviceId), date, Number(storeId));
  }

  @Get('/:id')
  detail(@Param('id') id: string) { return this.svc.getServiceById(Number(id)); }

  @Post('/book')
  book(@Body() dto: CreateServiceAppointmentDto) {
    return this.svc.book(dto);
  }

  @Post('/complete')
  complete(@Body() body: { jobId: string; additionsMinor?: number }) {
    return this.svc.complete(body.jobId, body.additionsMinor || 0);
  }

  @Post('/cancel')
  cancel(@Body() body: { jobId: string; askRefundDestination?: boolean }) {
    return this.svc.cancel(body.jobId, body.askRefundDestination ?? true);
  }

  @Get('my-appointments')
  async myAppointments(@Query('userId') userId: string) {
    return this.svc.getUserAppointments(Number(userId));
  }

  @Get('appointments/:id')
  async getAppointment(@Param('id') id: string) {
    return this.svc.getAppointmentById(id);
  }
}
