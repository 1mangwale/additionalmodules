import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingController } from './routes.pricing';
import { VendorPricingController } from './vendor.routes';
import { VendorPricingService } from './vendor.svc';
import { VendorPricingSlab } from './typeorm/vendor-pricing-slab.entity';
import { PricingService } from './svc.pricing';

function pgDataSource() {
  return TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT || 5432),
    username: process.env.PG_USER,
    password: process.env.PG_PASS,
    database: process.env.PG_DB,
    autoLoadEntities: true,
    synchronize: false,
  });
}

@Module({
  imports: [pgDataSource(), TypeOrmModule.forFeature([VendorPricingSlab])],
  controllers: [PricingController, VendorPricingController],
  providers: [PricingService, VendorPricingService],
})
export class PricingModule {}
