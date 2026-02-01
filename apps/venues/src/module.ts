import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { VenueType, VenueSlot, VenueBooking } from './typeorm/entities';
import { VenuesController } from './routes.venues';
import { VenuesVendorController } from './vendor.routes';
import { VenuesService } from './svc.venues';
import { StoreWorkingHours, VenuePeakPricing } from './typeorm/config-entities';

function pgDataSource() {
    return TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.PG_HOST || 'localhost',
        port: Number(process.env.PG_PORT || 5432),
        username: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASS || 'postgres',
        database: process.env.PG_DB || 'mangwale_booking',
        autoLoadEntities: true,
        synchronize: false,
    });
}

@Module({
    imports: [HttpModule, pgDataSource(), TypeOrmModule.forFeature([VenueType, VenueSlot, VenueBooking, StoreWorkingHours, VenuePeakPricing])],
    controllers: [VenuesController, VenuesVendorController],
    providers: [VenuesService],
})
export class VenuesModule { }
