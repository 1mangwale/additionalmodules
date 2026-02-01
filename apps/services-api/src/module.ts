import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCatalog, ServiceSlot, VendorStore, ServiceAppointment } from './typeorm/entities';
import { ServicesController } from './routes.services';
import { ServicesVendorController } from './vendor.routes';
import { ServicesService } from './svc.services';
import { HttpModule } from '@nestjs/axios';
import { StoreWorkingHours, StoreBreaks } from './typeorm/config-entities';

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
    TypeOrmModule.forFeature([ServiceCatalog, ServiceSlot, VendorStore, ServiceAppointment, StoreWorkingHours, StoreBreaks])
  ],
  controllers: [ServicesController, ServicesVendorController],
  providers: [ServicesService],
})
export class ServicesModule { }
