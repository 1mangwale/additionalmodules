import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie, Screen, Showtime, MovieBooking, ScreenSection, ScreenSeat, ShowtimeSeat, ShowtimePricing } from './typeorm/entities';
import { MoviesController } from './routes.movies';
import { MoviesVendorController } from './vendor.routes';
import { MoviesService } from './svc.movies';
import { TheaterLayoutService } from './svc.theater-layout';

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
  imports: [pgDataSource(), TypeOrmModule.forFeature([Movie, Screen, Showtime, MovieBooking, ScreenSection, ScreenSeat, ShowtimeSeat, ShowtimePricing])],
  controllers: [MoviesController, MoviesVendorController],
  providers: [MoviesService, TheaterLayoutService],
})
export class MoviesModule { }
