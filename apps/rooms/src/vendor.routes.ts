import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomType, RoomInventory, RoomRatePlan } from './typeorm/entities';
import { RoomsService } from './svc.rooms';

@ApiTags('rooms-vendor')
@Controller('/vendor/rooms')
export class RoomsVendorController {
  constructor(
    @InjectRepository(RoomType) private readonly roomTypes: Repository<RoomType>,
    @InjectRepository(RoomInventory) private readonly inventory: Repository<RoomInventory>,
    @InjectRepository(RoomRatePlan) private readonly ratePlans: Repository<RoomRatePlan>,
    private readonly svc: RoomsService,
  ) { }

  @Get('/room-types')
  async listRoomTypes() {
    return this.roomTypes.find({ take: 100 });
  }

  @Post('/room-types')
  async createRoomType(@Body() body: Partial<RoomType>) {
    const rt = this.roomTypes.create(body as any);
    return this.roomTypes.save(rt);
  }

  @Get('/rate-plans')
  async listRatePlans(@Query('room_type_id') roomTypeId?: string) {
    const where: any = {};
    if (roomTypeId) where.room_type_id = Number(roomTypeId);
    return this.ratePlans.find({ where, take: 100 });
  }

  @Post('/rate-plans')
  async createRatePlan(@Body() body: Partial<RoomRatePlan>) {
    const rp = this.ratePlans.create(body as any);
    return this.ratePlans.save(rp);
  }

  @Get('/inventory')
  async listInventory() {
    return this.inventory.find({ take: 200 });
  }

  @Post('/inventory')
  async upsertInventory(@Body() body: Partial<RoomInventory>) {
    const inv = this.inventory.create(body as any);
    return this.inventory.save(inv);
  }

  @Get('/bookings')
  async getBookings(@Query('storeId') storeId: string, @Query('status') status?: string) {
    return this.svc.getVendorBookings(Number(storeId), status);
  }
}
