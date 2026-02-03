import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Restaurant, TableType, TableBooking } from './typeorm/entities';
import { RestaurantsController } from './routes.restaurants';
import { RestaurantsVendorController } from './vendor.routes';
import { RestaurantsService } from './svc.restaurants';

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
  imports: [
    HttpModule,
    pgDataSource(),
    TypeOrmModule.forFeature([Restaurant, TableType, TableBooking]),
  ],
  controllers: [RestaurantsController, RestaurantsVendorController],
  providers: [RestaurantsService],
})
export class RestaurantsModule { }
