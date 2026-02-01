import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie, Screen, Showtime } from './typeorm/entities';
import { MoviesService } from './svc.movies';
import { TheaterLayoutService } from './svc.theater-layout';

@ApiTags('movies')
@Controller('/movies')
export class MoviesController {
  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    @InjectRepository(Screen) private readonly screens: Repository<Screen>,
    @InjectRepository(Showtime) private readonly showtimes: Repository<Showtime>,
    private readonly svc: MoviesService,
    private readonly layoutSvc: TheaterLayoutService,
  ) { }

  @Get('/health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { ok: true, service: 'movies', ts: new Date().toISOString() };
  }

  @Get('/catalog')
  @ApiOperation({ summary: 'List movies catalog' })
  @ApiQuery({ name: 'store_id', required: false })
  async catalog(@Query() q: any) {
    const where: any = {};
    if (q.store_id) where.store_id = Number(q.store_id);
    const items = await this.movies.find({ where, take: 200, order: { id: 'DESC' } });
    return { items, total: items.length };
  }

  @Get('/showtimes')
  async listShowtimes(@Query() q: any) {
    const where: any = {};
    if (q.store_id) where.store_id = Number(q.store_id);
    if (q.movie_id) where.movie_id = Number(q.movie_id);
    const items = await this.showtimes.find({ where, take: 200, order: { starts_at: 'ASC' } as any });
    return { items, total: items.length };
  }

  @Get('/my-bookings')
  async myBookings(@Query('userId') userId: string) {
    return this.svc.getUserBookings(Number(userId));
  }

  @Get('/bookings/:id')
  async getBooking(@Param('id') id: string) {
    return this.svc.getBookingById(id);
  }

  @Get('/:id')
  async detail(@Param('id') id: string) {
    const m = await this.movies.findOne({ where: { id: Number(id) } });
    return m;
  }

  @Post('/book')
  book(@Body() dto: any) {
    return this.svc.book(dto);
  }

  @Post('/cancel')
  cancel(@Body() body: { bookingId: string; userId: number }) {
    return this.svc.cancel(body.bookingId, body.userId);
  }

  // Theater Seating APIs
  @Get('/showtimes/:id/seats')
  async getShowtimeSeats(@Param('id') id: string) {
    return this.layoutSvc.getShowtimeAvailability(Number(id));
  }

  @Post('/seats/reserve')
  async reserveSeats(@Body() dto: { user_id?: number; userId?: number; showtime_id?: number; showtimeId?: number; seat_numbers?: string[]; seats?: string[] }) {
    const userId = dto.user_id || dto.userId;
    const showtimeId = dto.showtime_id || dto.showtimeId;
    const seats = dto.seat_numbers || dto.seats;

    if (!userId || !showtimeId || !seats || seats.length === 0) {
      throw new Error('Missing required parameters: user_id, showtime_id, seat_numbers');
    }

    return this.layoutSvc.reserveSeats(showtimeId, userId, seats);
  }
}
