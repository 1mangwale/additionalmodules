import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie, Screen, Showtime } from './typeorm/entities';
import { MoviesService } from './svc.movies';
import { TheaterLayoutService } from './svc.theater-layout';

@Controller('/vendor/movies')
export class MoviesVendorController {
  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    @InjectRepository(Screen) private readonly screens: Repository<Screen>,
    @InjectRepository(Showtime) private readonly showtimes: Repository<Showtime>,
    private readonly svc: MoviesService,
    private readonly layoutSvc: TheaterLayoutService,
  ) { }

  @Get('/catalog')
  listMovies() { return this.movies.find({ take: 200, order: { id: 'DESC' } as any }); }
  @Post('/catalog')
  async createMovie(@Body() body: Partial<Movie>) { const m = this.movies.create(body as any); return this.movies.save(m); }

  @Get('/screens')
  listScreens() { return this.screens.find({ take: 200, order: { id: 'DESC' } as any }); }
  @Post('/screens')
  async createScreen(@Body() body: Partial<Screen>) { const s = this.screens.create(body as any); return this.screens.save(s); }

  @Get('/showtimes')
  listShowtimes() { return this.showtimes.find({ take: 200, order: { starts_at: 'ASC' } as any }); }
  @Post('/showtimes')
  async createShowtime(@Body() body: Partial<Showtime>) { const st = this.showtimes.create(body as any); return this.showtimes.save(st); }
  @Delete('/showtimes/:id')
  async deleteShowtime(@Param('id') id: string) { await this.showtimes.delete({ id: Number(id) } as any); return { ok: true }; }

  @Get('/bookings')
  async getBookings(@Query('storeId') storeId: string, @Query('status') status?: string) {
    return this.svc.getVendorBookings(Number(storeId), status);
  }

  // Theater Layout Management
  @Post('/screens/:id/layout')
  async updateScreenLayout(@Param('id') id: string, @Body() layoutConfig: any) {
    return this.layoutSvc.updateScreenLayout(Number(id), layoutConfig);
  }

  @Get('/screens/:id/layout')
  async getScreenLayout(@Param('id') id: string) {
    return this.layoutSvc.getScreenLayout(Number(id));
  }

  @Post('/showtimes/:id/pricing')
  async setShowtimePricing(@Param('id') id: string, @Body() body: { sections: Array<{ section_id: string; price_minor: number }> }) {
    return this.layoutSvc.setShowtimePricing(Number(id), body.sections);
  }
}
