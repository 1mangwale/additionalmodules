import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VendorPricingService } from './vendor.svc';

@ApiTags('pricing-vendor')
@Controller('/pricing/vendor/slabs')
export class VendorPricingController {
  constructor(private readonly svc: VendorPricingService) {}

  @Get()
  list(@Query('vendor_id') vendorId?: string, @Query('store_id') storeId?: string) {
    return this.svc.list({ vendorId: vendorId ? Number(vendorId) : undefined, storeId: storeId ? Number(storeId) : undefined });
  }

  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
