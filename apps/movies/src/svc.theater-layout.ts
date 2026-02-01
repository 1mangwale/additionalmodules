import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Screen, ScreenSection, ScreenSeat, ShowtimeSeat, ShowtimePricing, Showtime } from './typeorm/entities';

interface LayoutSection {
    section_id: string;
    name: string;
    rows: string[] | { row: string; seats: number; start_number?: number }[];
    seats_per_row?: number;
    price_multiplier: number;
    seat_type?: string;
    color?: string;
    type?: string;
}

interface LayoutConfig {
    sections: LayoutSection[];
    metadata?: any;
}

@Injectable()
export class TheaterLayoutService {
    constructor(
        @InjectRepository(Screen) private readonly screens: Repository<Screen>,
        @InjectRepository(ScreenSection) private readonly sections: Repository<ScreenSection>,
        @InjectRepository(ScreenSeat) private readonly seats: Repository<ScreenSeat>,
        @InjectRepository(ShowtimeSeat) private readonly showtimeSeats: Repository<ShowtimeSeat>,
        @InjectRepository(ShowtimePricing) private readonly pricing: Repository<ShowtimePricing>,
        @InjectRepository(Showtime) private readonly showtimes: Repository<Showtime>,
    ) { }

    /**
     * Create or update screen layout from template
     */
    async updateScreenLayout(screenId: number, layoutConfig: LayoutConfig) {
        const screen = await this.screens.findOne({ where: { id: screenId as any } });
        if (!screen) {
            throw new NotFoundException('Screen not found');
        }

        // Validate layout
        this.validateLayout(layoutConfig);

        // Delete existing seats and sections
        await this.seats.delete({ screen_id: screenId as any });
        await this.sections.delete({ screen_id: screenId as any });

        let totalSeats = 0;
        let positionY = 0;

        // Process each section
        for (const section of layoutConfig.sections) {
            if (section.type === 'gap') {
                positionY += 2; // Gap spacing
                continue;
            }

            // Create section
            const sectionEntity = this.sections.create({
                screen_id: screenId as any,
                section_id: section.section_id,
                name: section.name,
                price_multiplier: section.price_multiplier.toString() as any,
                seat_type: section.seat_type || 'standard',
                color: section.color || '#90EE90',
                display_order: positionY,
            });
            await this.sections.save(sectionEntity);

            // Generate seats for this section
            const rows = this.normalizeRows(section);
            for (const rowConfig of rows) {
                const row = typeof rowConfig === 'string' ? rowConfig : rowConfig.row;
                const seatsInRow = typeof rowConfig === 'object' ? rowConfig.seats : (section.seats_per_row || 10);
                const startNumber = typeof rowConfig === 'object' ? (rowConfig.start_number || 1) : 1;

                for (let seatNum = startNumber; seatNum < startNumber + seatsInRow; seatNum++) {
                    const seatLabel = `${row}${seatNum}`;
                    const seat = this.seats.create({
                        screen_id: screenId as any,
                        section_id: section.section_id,
                        row_label: row,
                        seat_number: seatNum,
                        seat_label: seatLabel,
                        seat_type: section.seat_type || 'standard',
                        position_x: seatNum - startNumber,
                        position_y: positionY,
                    });
                    await this.seats.save(seat);
                    totalSeats++;
                }
                positionY++;
            }
        }

        // Update screen
        screen.layout_config = layoutConfig;
        screen.total_capacity = totalSeats;
        screen.seat_count = totalSeats;
        await this.screens.save(screen);

        return {
            screen_id: screenId,
            total_seats: totalSeats,
            sections: layoutConfig.sections.filter(s => s.type !== 'gap').length,
            message: 'Layout updated successfully',
        };
    }

    /**
     * Get screen layout with visual coordinates
     */
    async getScreenLayout(screenId: number) {
        const screen = await this.screens.findOne({ where: { id: screenId as any } });
        if (!screen) {
            throw new NotFoundException('Screen not found');
        }

        const sections = await this.sections.find({
            where: { screen_id: screenId as any },
            order: { display_order: 'ASC' }
        });

        const seats = await this.seats.find({
            where: { screen_id: screenId as any },
            order: { position_y: 'ASC', position_x: 'ASC' }
        });

        // Group seats by row
        const seatsByRow: { [row: string]: any[] } = {};
        for (const seat of seats) {
            if (!seatsByRow[seat.row_label]) {
                seatsByRow[seat.row_label] = [];
            }
            seatsByRow[seat.row_label].push({
                id: seat.id,
                label: seat.seat_label,
                type: seat.seat_type,
                blocked: seat.is_blocked,
                section: seat.section_id,
                x: seat.position_x,
                y: seat.position_y,
            });
        }

        return {
            screen_id: screenId,
            name: screen.name,
            total_seats: screen.total_capacity,
            layout_config: screen.layout_config,
            sections: sections.map(s => ({
                id: s.section_id,
                name: s.name,
                price_multiplier: parseFloat(s.price_multiplier),
                color: s.color,
                seat_type: s.seat_type,
            })),
            seats_by_row: seatsByRow,
            metadata: screen.layout_config?.metadata || {},
        };
    }

    /**
     * Get real-time seat availability for a showtime
     */
    async getShowtimeAvailability(showtimeId: number) {
        const showtime = await this.showtimes.findOne({ where: { id: showtimeId as any } });
        if (!showtime) {
            throw new NotFoundException('Showtime not found');
        }

        const screen = await this.screens.findOne({ where: { id: showtime.screen_id as any } });
        const sections = await this.sections.find({ where: { screen_id: showtime.screen_id as any } });
        const pricing = await this.pricing.find({ where: { showtime_id: showtimeId as any } });

        // Get all seats with their availability status
        const availabilityQuery = `
      SELECT 
        ss.id as seat_id,
        ss.seat_label,
        ss.row_label,
        ss.section_id,
        ss.seat_type,
        ss.position_x,
        ss.position_y,
        COALESCE(sts.status, 'available') as status,
        sts.reserved_until,
        sec.name as section_name,
        COALESCE(sp.price_minor, ${parseInt(showtime.base_price) * 100}) as price_minor
      FROM screen_seats ss
      LEFT JOIN showtime_seats sts ON sts.seat_id = ss.id AND sts.showtime_id = $1
      LEFT JOIN screen_sections sec ON sec.section_id = ss.section_id AND sec.screen_id = ss.screen_id
      LEFT JOIN showtime_pricing sp ON sp.section_id = ss.section_id AND sp.showtime_id = $1
      WHERE ss.screen_id = $2 AND ss.is_blocked = FALSE
      ORDER BY ss.position_y, ss.position_x
    `;

        const seats = await this.seats.query(availabilityQuery, [showtimeId, showtime.screen_id]);

        // Group by section
        const seatsBySection: { [key: string]: any[] } = {};
        for (const seat of seats) {
            if (!seatsBySection[seat.section_id]) {
                seatsBySection[seat.section_id] = [];
            }
            seatsBySection[seat.section_id].push({
                id: seat.seat_id,
                label: seat.seat_label,
                row: seat.row_label,
                type: seat.seat_type,
                status: seat.status,
                price: seat.price_minor,
                x: seat.position_x,
                y: seat.position_y,
            });
        }

        const availableCount = seats.filter((s: any) => s.status === 'available').length;

        return {
            showtime_id: showtimeId,
            screen_name: screen?.name,
            total_seats: seats.length,
            available: availableCount,
            booked: seats.filter((s: any) => s.status === 'booked').length,
            reserved: seats.filter((s: any) => s.status === 'reserved').length,
            sections: sections.map(s => ({
                id: s.section_id,
                name: s.name,
                price_multiplier: parseFloat(s.price_multiplier),
                color: s.color,
                seats: seatsBySection[s.section_id] || [],
            })),
            pricing: pricing.map(p => ({
                section: p.section_id,
                price_minor: p.price_minor,
            })),
        };
    }

    /**
     * Reserve seats temporarily (10 minutes)
     */
    async reserveSeats(showtimeId: number, userId: number, seatLabels: string[]) {
        const showtime = await this.showtimes.findOne({ where: { id: showtimeId as any } });
        if (!showtime) {
            throw new NotFoundException('Showtime not found');
        }

        // Get seat IDs
        const seats = await this.seats
            .createQueryBuilder('seat')
            .where('seat.screen_id = :screenId', { screenId: showtime.screen_id })
            .andWhere('seat.seat_label IN (:...labels)', { labels: seatLabels })
            .getMany();

        if (seats.length !== seatLabels.length) {
            throw new BadRequestException('Some seats not found');
        }

        const seatIds = seats.map(s => s.id);

        // Check if seats are available
        const showtimeSeats = await this.showtimeSeats
            .createQueryBuilder('st')
            .where('st.showtime_id = :showtimeId', { showtimeId })
            .andWhere('st.seat_id IN (:...seatIds)', { seatIds })
            .getMany();

        const unavailable = showtimeSeats.filter(s => s.status !== 'available');
        if (unavailable.length > 0) {
            throw new BadRequestException('Some seats are already booked or reserved');
        }

        // Reserve seats for 10 minutes
        const reservedUntil = new Date(Date.now() + 10 * 60 * 1000);

        for (const seatId of seatIds) {
            await this.showtimeSeats.update(
                { showtime_id: showtimeId as any, seat_id: seatId as any },
                {
                    status: 'reserved',
                    reserved_by: userId as any,
                    reserved_at: new Date(),
                    reserved_until: reservedUntil,
                }
            );
        }

        return {
            reserved: seatLabels,
            reserved_until: reservedUntil,
            message: 'Seats reserved for 10 minutes',
        };
    }

    /**
     * Set pricing for showtime sections
     */
    async setShowtimePricing(showtimeId: number, sectionPricing: { section_id: string; price_minor: number }[]) {
        const showtime = await this.showtimes.findOne({ where: { id: showtimeId as any } });
        if (!showtime) {
            throw new NotFoundException('Showtime not found');
        }

        // Delete existing pricing
        await this.pricing.delete({ showtime_id: showtimeId as any });

        // Insert new pricing
        for (const sp of sectionPricing) {
            const pricing = this.pricing.create({
                showtime_id: showtimeId as any,
                section_id: sp.section_id,
                price_minor: sp.price_minor as any,
            });
            await this.pricing.save(pricing);
        }

        return { message: 'Pricing updated', sections: sectionPricing.length };
    }

    private validateLayout(config: LayoutConfig) {
        if (!config.sections || config.sections.length === 0) {
            throw new BadRequestException('Layout must have at least one section');
        }

        const sectionIds = new Set();
        for (const section of config.sections) {
            if (section.type === 'gap') continue;

            if (!section.section_id || !section.name) {
                throw new BadRequestException('Section must have section_id and name');
            }

            if (sectionIds.has(section.section_id)) {
                throw new BadRequestException(`Duplicate section_id: ${section.section_id}`);
            }
            sectionIds.add(section.section_id);

            if (!section.rows || section.rows.length === 0) {
                throw new BadRequestException(`Section ${section.section_id} must have rows`);
            }
        }
    }

    private normalizeRows(section: LayoutSection): (string | { row: string; seats: number; start_number?: number })[] {
        if (Array.isArray(section.rows)) {
            return section.rows;
        }
        return [];
    }
}
