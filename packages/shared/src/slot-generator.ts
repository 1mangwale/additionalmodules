/**
 * Shared Slot Generation Service
 * 
 * Generates available time slots for any booking type (services, venues, movies, rooms)
 * based on duration and buffer time. This is a database-driven, flexible solution
 * that prevents booking conflicts across all modules.
 */

export interface TimeSlot {
  start_time: string;      // "09:00" or "09:00:00"
  end_time: string;        // "10:00" or "10:00:00"
  duration_min: number;    // Actual booking duration
  buffer_min: number;      // Gap after booking
  available: boolean;
  price_override?: number; // Optional variable pricing
}

export interface BookingResource {
  duration_min: number;
  buffer_time_min: number;
  id?: number;
  name?: string;
}

export interface WorkingHours {
  start: string;           // "09:00" or "09:00:00"
  end: string;             // "18:00" or "18:00:00"
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
export function generateAvailableSlots(
  resource: BookingResource,
  workingHours: WorkingHours,
  existingBookings: ExistingBooking[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  if (!resource.duration_min || resource.duration_min <= 0) {
    console.warn('Invalid duration_min:', resource.duration_min);
    return slots;
  }

  const totalBlockTime = resource.duration_min + (resource.buffer_time_min || 0);

  let currentMinutes = timeToMinutes(workingHours.start);
  const endMinutes = timeToMinutes(workingHours.end);

  while (currentMinutes + resource.duration_min <= endMinutes) {
    const slotStart = currentMinutes;
    const slotEnd = currentMinutes + resource.duration_min;

    // Check if slot falls during break time
    const isDuringBreak = (workingHours.breaks || []).some(brk => {
      const breakStart = timeToMinutes(brk.start);
      const breakEnd = timeToMinutes(brk.end);
      return slotStart < breakEnd && slotEnd > breakStart;
    });

    if (isDuringBreak) {
      currentMinutes += 15; // Skip forward by 15 min
      continue;
    }

    // Check if slot conflicts with existing bookings (including their buffers)
    const hasConflict = existingBookings.some(booking => {
      const bookingStart = getBookingStartMinutes(booking.start_time);
      const bookingDuration = booking.duration_min || 0;
      const bookingBuffer = booking.buffer_min || 0;
      const bookingEnd = bookingStart + bookingDuration + bookingBuffer;

      // Check overlap
      return slotStart < bookingEnd && slotEnd > bookingStart;
    });

    if (!hasConflict) {
      slots.push({
        start_time: minutesToTime(slotStart),
        end_time: minutesToTime(slotEnd),
        duration_min: resource.duration_min,
        buffer_min: resource.buffer_time_min || 0,
        available: true
      });
    }

    currentMinutes += totalBlockTime; // Move to next potential slot
  }

  return slots;
}

/**
 * Generate slots with variable pricing support (for venues)
 */
export function generateAvailableSlotsWithPricing(
  resource: BookingResource & { base_price: number },
  workingHours: WorkingHours,
  existingBookings: ExistingBooking[] = [],
  pricingRules?: {
    peak_hours: Array<{ start: string, end: string, multiplier: number }>;
  }
): (TimeSlot & { price: number })[] {
  const baseSlots = generateAvailableSlots(resource, workingHours, existingBookings);

  return baseSlots.map(slot => {
    let price = resource.base_price;

    // Apply pricing rules if provided
    if (pricingRules?.peak_hours) {
      const slotMinutes = timeToMinutes(slot.start_time);

      for (const rule of pricingRules.peak_hours) {
        const ruleStart = timeToMinutes(rule.start);
        const ruleEnd = timeToMinutes(rule.end);

        if (slotMinutes >= ruleStart && slotMinutes < ruleEnd) {
          price = Math.round(resource.base_price * rule.multiplier);
          break;
        }
      }
    }

    return { ...slot, price };
  });
}

/**
 * Check if a specific time slot is available
 */
export function isSlotAvailable(
  slotStart: string | Date,
  duration_min: number,
  buffer_min: number,
  existingBookings: ExistingBooking[]
): boolean {
  const startMinutes = typeof slotStart === 'string'
    ? timeToMinutes(slotStart)
    : slotStart.getHours() * 60 + slotStart.getMinutes();

  const endMinutes = startMinutes + duration_min + buffer_min;

  return !existingBookings.some(booking => {
    const bookingStart = getBookingStartMinutes(booking.start_time);
    const bookingEnd = bookingStart + booking.duration_min + booking.buffer_min;

    return startMinutes < bookingEnd && endMinutes > bookingStart;
  });
}

/**
 * Calculate next available slot after a given time
 */
export function getNextAvailableSlot(
  afterTime: string | Date,
  resource: BookingResource,
  workingHours: WorkingHours,
  existingBookings: ExistingBooking[] = []
): TimeSlot | null {
  const slots = generateAvailableSlots(resource, workingHours, existingBookings);

  const afterMinutes = typeof afterTime === 'string'
    ? timeToMinutes(afterTime)
    : afterTime.getHours() * 60 + afterTime.getMinutes();

  return slots.find(slot => timeToMinutes(slot.start_time) >= afterMinutes) || null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert time string (HH:MM or HH:MM:SS) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get start time in minutes from various input formats
 */
function getBookingStartMinutes(startTime: string | Date): number {
  if (typeof startTime === 'string') {
    // If it's a time string like "09:00"
    if (startTime.includes(':') && startTime.length <= 8) {
      return timeToMinutes(startTime);
    }
    // If it's an ISO string, convert to Date
    const date = new Date(startTime);
    return date.getHours() * 60 + date.getMinutes();
  }

  // It's a Date object
  return startTime.getHours() * 60 + startTime.getMinutes();
}

/**
 * Format time in 12-hour format with AM/PM
 */
export function formatTime12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get default working hours based on module type
 */
export function getDefaultWorkingHours(moduleType: 'services' | 'venues' | 'movies' | 'rooms'): WorkingHours {
  switch (moduleType) {
    case 'services':
      return {
        start: '09:00',
        end: '18:00',
        breaks: [{ start: '12:00', end: '13:00' }] // Lunch break
      };

    case 'venues':
      return {
        start: '06:00', // Early morning sports
        end: '22:00',   // Late evening sessions
        breaks: []      // No breaks for venues
      };

    case 'movies':
      return {
        start: '10:00', // Morning shows
        end: '23:59',   // Late night shows
        breaks: []      // No breaks
      };

    case 'rooms':
      return {
        start: '14:00', // Check-in time
        end: '11:00',   // Check-out time (next day)
        breaks: []
      };

    default:
      return {
        start: '09:00',
        end: '18:00',
        breaks: []
      };
  }
}

/**
 * Validate booking doesn't conflict with existing bookings
 */
export function validateBooking(
  startTime: string | Date,
  duration_min: number,
  buffer_min: number,
  existingBookings: ExistingBooking[]
): { valid: boolean; reason?: string } {
  const isAvailable = isSlotAvailable(startTime, duration_min, buffer_min, existingBookings);

  if (!isAvailable) {
    return {
      valid: false,
      reason: 'Time slot conflicts with existing booking'
    };
  }

  return { valid: true };
}
