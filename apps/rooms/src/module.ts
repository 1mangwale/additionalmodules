import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomType, RoomRatePlan, RoomInventory, RoomBooking, RoomBookingItem } from './typeorm/entities';
import { RoomsController } from './routes.rooms';
import { RoomsVendorController } from './vendor.routes';
import { RoomsService } from './svc.rooms';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT || 5432),
      username: process.env.PG_USER,
      password: process.env.PG_PASS,
      database: process.env.PG_DB,
      autoLoadEntities: true,
      synchronize: false,
    }),
    TypeOrmModule.forFeature([RoomType, RoomRatePlan, RoomInventory, RoomBooking, RoomBookingItem])
  ],
  controllers: [RoomsController, RoomsVendorController],
  providers: [RoomsService],
})
export class RoomsModule { }
