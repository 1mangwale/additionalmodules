/**
 * Shared Slot Generation Service
 *
 * Generates available time slots for any booking type (services, venues, movies, rooms)
 * based on duration and buffer time. This is a database-driven, flexible solution
 * that prevents booking conflicts across all modules.
 */
export interface TimeSlot {
    start_time: string;
    end_time: string;
    duration_min: number;
    buffer_min: number;
    available: boolean;
    price_override?: number;
}
export interface BookingResource {
    duration_min: number;
    buffer_time_min: number;
    id?: number;
    name?: string;
}
export interface WorkingHours {
    start: string;
    end: string;
    breaks?: Array<{
        start: string;
        end: string;
    }>;
}
export interface ExistingBooking {
    start_time: string | Date;
    duration_min: number;
    buffer_min: number;
}
/**
 * Core slot generation algorithm
 * Works for services, venues, movies - any time-based booking
 */
export declare function generateAvailableSlots(resource: BookingResource, workingHours: WorkingHours, existingBookings?: ExistingBooking[]): TimeSlot[];
/**
 * Generate slots with variable pricing support (for venues)
 */
export declare function generateAvailableSlotsWithPricing(resource: BookingResource & {
    base_price: number;
}, workingHours: WorkingHours, existingBookings?: ExistingBooking[], pricingRules?: {
    peak_hours: Array<{
        start: string;
        end: string;
        multiplier: number;
    }>;
}): (TimeSlot & {
    price: number;
})[];
/**
 * Check if a specific time slot is available
 */
export declare function isSlotAvailable(slotStart: string | Date, duration_min: number, buffer_min: number, existingBookings: ExistingBooking[]): boolean;
/**
 * Calculate next available slot after a given time
 */
export declare function getNextAvailableSlot(afterTime: string | Date, resource: BookingResource, workingHours: WorkingHours, existingBookings?: ExistingBooking[]): TimeSlot | null;
/**
 * Convert time string (HH:MM or HH:MM:SS) to minutes since midnight
 */
export declare function timeToMinutes(time: string): number;
/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export declare function minutesToTime(minutes: number): string;
/**
 * Format time in 12-hour format with AM/PM
 */
export declare function formatTime12Hour(time: string): string;
/**
 * Get default working hours based on module type
 */
export declare function getDefaultWorkingHours(moduleType: 'services' | 'venues' | 'movies' | 'rooms'): WorkingHours;
/**
 * Validate booking doesn't conflict with existing bookings
 */
export declare function validateBooking(startTime: string | Date, duration_min: number, buffer_min: number, existingBookings: ExistingBooking[]): {
    valid: boolean;
    reason?: string;
};
