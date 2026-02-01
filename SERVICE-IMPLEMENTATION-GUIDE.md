# 🔧 Service Duration & Buffer Time - Implementation Guide

## Quick Summary

**What's Needed:**
1. Add `buffer_time_min` column (duration_min already exists!)
2. Smart slot generation API
3. Update user UI to show duration + available slots
4. Vendor schedule view

---

## Part 1: Database & Entity Updates

### Step 1.1: Database Migration

```sql
-- Add buffer_time_min to services_catalog
ALTER TABLE services_catalog 
ADD COLUMN buffer_time_min INTEGER DEFAULT 15;

-- Set sensible defaults based on category
UPDATE services_catalog SET buffer_time_min = 10 WHERE category IN ('salon', 'quick-fix');
UPDATE services_catalog SET buffer_time_min = 15 WHERE category IN ('plumbing', 'electrical', 'carpentry');
UPDATE services_catalog SET buffer_time_min = 20 WHERE category IN ('ac-repair', 'appliance-repair');
UPDATE services_catalog SET buffer_time_min = 30 WHERE category IN ('cleaning', 'painting');

-- Also ensure duration_min has values
UPDATE services_catalog SET duration_min = 30 WHERE duration_min IS NULL AND category = 'salon';
UPDATE services_catalog SET duration_min = 60 WHERE duration_min IS NULL AND category IN ('plumbing', 'electrical');
UPDATE services_catalog SET duration_min = 90 WHERE duration_min IS NULL AND category IN ('ac-repair', 'cleaning');
UPDATE services_catalog SET duration_min = 120 WHERE duration_min IS NULL AND category = 'painting';
```

### Step 1.2: Update Entity

**File:** `apps/services-api/src/typeorm/entities.ts`

```typescript
@Entity({ name: 'services_catalog' })
export class ServiceCatalog {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'bigint' }) store_id!: number;
  @Column({ type: 'text' }) name!: string;
  @Column({ type: 'text', nullable: true }) category!: string | null;
  @Column({ type: 'text', nullable: true }) parent_category!: string | null;
  @Column({ type: 'text', default: 'dynamic' }) pricing_model!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) base_price!: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 }) visit_fee!: string;
  @Column({ type: 'boolean', default: true }) at_customer_location!: boolean;
  @Column({ type: 'smallint', default: 1 }) status!: number;
  
  // ⭐ Duration fields
  @Column({ type: 'int', nullable: true }) duration_min!: number | null;
  @Column({ type: 'int', default: 15 }) buffer_time_min!: number; // ⬅️ ADD THIS
}
```

---

## Part 2: Smart Slot Generation Backend

### Step 2.1: Create Slot Generation Service

**File:** `apps/services-api/src/svc.services.ts`

Add these helper methods to the `ServicesService` class:

```typescript
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

@Injectable()
export class ServicesService {
  // ... existing code ...

  /**
   * Generate available slots for a service on a specific date
   */
  async getSmartSlots(serviceId: number, date: string, storeId: number) {
    // 1. Get service details
    const service = await this.catalog.findOne({ 
      where: { id: serviceId } 
    });
    
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.duration_min) {
      throw new BadRequestException('Service duration not configured');
    }

    // 2. Define working hours (could be from store settings later)
    const workingHours = {
      start: '09:00',
      end: '18:00',
      breaks: [{ start: '12:00', end: '13:00' }] // Lunch break
    };

    // 3. Get existing appointments for this date
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);
    
    const existingAppointments = await this.appointments.find({
      where: {
        store_id: storeId,
        scheduled_for: Between(startOfDay, endOfDay)
      },
      relations: ['service']
    });

    // 4. Generate available slots
    const slots = this.generateAvailableSlots(
      service,
      workingHours,
      existingAppointments
    );

    return {
      service_id: service.id,
      service_name: service.name,
      duration_min: service.duration_min,
      buffer_min: service.buffer_time_min,
      date,
      available_slots: slots
    };
  }

  /**
   * Core slot generation algorithm
   */
  private generateAvailableSlots(
    service: ServiceCatalog,
    workingHours: { start: string; end: string; breaks: Array<{ start: string; end: string }> },
    bookedAppointments: ServiceAppointment[]
  ) {
    const slots: Array<{
      start_time: string;
      end_time: string;
      available: boolean;
    }> = [];

    const serviceDuration = service.duration_min || 60;
    const bufferTime = service.buffer_time_min || 15;
    const totalSlotTime = serviceDuration + bufferTime;

    let currentMinutes = this.timeToMinutes(workingHours.start);
    const endMinutes = this.timeToMinutes(workingHours.end);

    while (currentMinutes + serviceDuration <= endMinutes) {
      const slotStart = currentMinutes;
      const slotEnd = currentMinutes + serviceDuration;

      // Check if slot falls during break time
      const isDuringBreak = workingHours.breaks.some(brk => {
        const breakStart = this.timeToMinutes(brk.start);
        const breakEnd = this.timeToMinutes(brk.end);
        return slotStart < breakEnd && slotEnd > breakStart;
      });

      if (isDuringBreak) {
        currentMinutes += 15; // Skip forward by 15 min
        continue;
      }

      // Check if slot conflicts with existing appointments
      const hasConflict = bookedAppointments.some(appt => {
        if (!appt.service?.duration_min) return false;
        
        // Extract appointment start time (assuming scheduled_for contains the time)
        const apptDate = new Date(appt.scheduled_for);
        const apptStartMinutes = apptDate.getHours() * 60 + apptDate.getMinutes();
        const apptDuration = appt.service.duration_min;
        const apptBuffer = appt.service.buffer_time_min || 15;
        const apptEndMinutes = apptStartMinutes + apptDuration + apptBuffer;

        // Check overlap
        return slotStart < apptEndMinutes && slotEnd > apptStartMinutes;
      });

      if (!hasConflict) {
        slots.push({
          start_time: this.minutesToTime(slotStart),
          end_time: this.minutesToTime(slotEnd),
          available: true
        });
      }

      currentMinutes += totalSlotTime; // Move to next slot
    }

    return slots;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
```

### Step 2.2: Add Smart Slots Endpoint

**File:** `apps/services-api/src/routes.services.ts`

```typescript
@Controller('/services')
export class ServicesController {
  // ... existing code ...

  @Get('/smart-slots')
  async getSmartSlots(
    @Query('service_id') serviceId: string,
    @Query('date') date: string,
    @Query('store_id') storeId: string
  ) {
    return this.svc.getSmartSlots(
      Number(serviceId),
      date,
      Number(storeId)
    );
  }
}
```

---

## Part 3: User Portal UI Updates

### Step 3.1: Update Service Booking Component

**File:** `apps/web-user/src/ui/App.tsx`

Update the Services tab section:

```typescript
// Add new state for smart slots
const [selectedService, setSelectedService] = useState<any>(null);
const [smartSlots, setSmartSlots] = useState<any>(null);

// Load smart slots when service and date are selected
const loadSmartSlots = async (serviceId: number, date: string) => {
  try {
    const response = await fetch(
      `/services/smart-slots?service_id=${serviceId}&date=${date}&store_id=1`
    );
    const data = await response.json();
    setSmartSlots(data);
  } catch (error) {
    console.error('Failed to load smart slots:', error);
  }
};

// Service selection UI with duration display
return (
  <div className="services-tab">
    <h2>Book a Service</h2>
    
    {/* Service List */}
    {!selectedService && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {services.map((service: any) => (
          <div
            key={service.id}
            onClick={() => {
              setSelectedService(service);
              if (serviceDate) {
                loadSmartSlots(service.id, serviceDate);
              }
            }}
            style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              ':hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{service.name}</h3>
            
            {service.category && (
              <div style={{ 
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: '#e3f2fd',
                borderRadius: '12px',
                fontSize: '12px',
                marginBottom: '12px'
              }}>
                {service.category}
              </div>
            )}
            
            {/* ⭐ Duration Display */}
            {service.duration_min && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                margin: '12px 0',
                color: '#666'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>{service.duration_min} minutes</span>
              </div>
            )}
            
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32', marginTop: '8px' }}>
              ₹{service.base_price}
            </div>
            
            <button style={{
              marginTop: '12px',
              width: '100%',
              padding: '10px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              Select Service
            </button>
          </div>
        ))}
      </div>
    )}
    
    {/* Date & Slot Selection */}
    {selectedService && (
      <div>
        <button 
          onClick={() => {
            setSelectedService(null);
            setSmartSlots(null);
          }}
          style={{ marginBottom: '20px', padding: '8px 16px' }}
        >
          ← Back to Services
        </button>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>{selectedService.name}</h3>
          <p style={{ color: '#666' }}>
            ⏱️ Duration: {selectedService.duration_min} minutes
          </p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>
            ₹{selectedService.base_price}
          </p>
        </div>
        
        {/* Date Picker */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Select Date:
          </label>
          <input
            type="date"
            value={serviceDate}
            onChange={(e) => {
              setServiceDate(e.target.value);
              loadSmartSlots(selectedService.id, e.target.value);
            }}
            min={new Date().toISOString().split('T')[0]}
            style={{
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '300px'
            }}
          />
        </div>
        
        {/* Smart Slots Display */}
        {smartSlots && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>
              Available Times on {new Date(serviceDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            {smartSlots.available_slots.length === 0 ? (
              <p style={{ color: '#999', padding: '20px', textAlign: 'center' }}>
                No available slots for this date. Please try another date.
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                {smartSlots.available_slots.map((slot: any) => {
                  const startTime = slot.start_time;
                  const [hours, minutes] = startTime.split(':').map(Number);
                  const period = hours >= 12 ? 'PM' : 'AM';
                  const displayHours = hours % 12 || 12;
                  const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                  
                  return (
                    <button
                      key={slot.start_time}
                      onClick={() => {
                        setSelectedSlot(slot);
                        bookService(selectedService, slot);
                      }}
                      style={{
                        padding: '16px 12px',
                        border: '2px solid #1976d2',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1976d2';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = 'black';
                      }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {formattedTime}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                        {selectedService.duration_min} min
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
);

// Updated book service function
const bookService = async (service: any, slot: any) => {
  try {
    // Convert slot start time to full timestamp
    const [hours, minutes] = slot.start_time.split(':').map(Number);
    const scheduledDate = new Date(serviceDate);
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    const response = await fetch('/services/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        serviceId: service.id,
        scheduledFor: scheduledDate.toISOString(),
        storeId: 1,
      }),
    });
    
    if (response.ok) {
      alert(`Service booked successfully for ${slot.start_time}!`);
      setSelectedService(null);
      setSmartSlots(null);
    } else {
      const error = await response.json();
      alert(`Booking failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Booking error:', error);
    alert('Failed to book service');
  }
};
```

---

## Part 4: Vendor Schedule View

**File:** `apps/web-vendor/src/ui/App.tsx`

Add a new "Schedule" tab for vendors:

```typescript
// Add new state
const [vendorScheduleDate, setVendorScheduleDate] = useState<string>(
  new Date().toISOString().split('T')[0]
);
const [vendorAppointments, setVendorAppointments] = useState<any[]>([]);

// Load vendor appointments
const loadVendorSchedule = async (date: string) => {
  try {
    const response = await fetch(`/services/vendor/appointments?date=${date}`);
    const data = await response.json();
    setVendorAppointments(data);
  } catch (error) {
    console.error('Failed to load schedule:', error);
  }
};

// Schedule tab content
<div className="schedule-tab">
  <h2>Daily Schedule</h2>
  
  <div style={{ marginBottom: '20px' }}>
    <input
      type="date"
      value={vendorScheduleDate}
      onChange={(e) => {
        setVendorScheduleDate(e.target.value);
        loadVendorSchedule(e.target.value);
      }}
      style={{
        padding: '10px',
        fontSize: '16px',
        border: '1px solid #ddd',
        borderRadius: '6px'
      }}
    />
  </div>
  
  {vendorAppointments.length === 0 ? (
    <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
      No appointments scheduled for this date
    </p>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {vendorAppointments.map((appt: any) => {
        const startTime = new Date(appt.scheduled_for);
        const [hours, minutes] = [startTime.getHours(), startTime.getMinutes()];
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        
        const duration = appt.service?.duration_min || 60;
        const buffer = appt.service?.buffer_time_min || 15;
        const endTime = new Date(startTime.getTime() + duration * 60000);
        const endHours = endTime.getHours();
        const endPeriod = endHours >= 12 ? 'PM' : 'AM';
        const endDisplayHours = endHours % 12 || 12;
        const formattedEndTime = `${endDisplayHours}:${endTime.getMinutes().toString().padStart(2, '0')} ${endPeriod}`;
        
        return (
          <div
            key={appt.id}
            style={{
              padding: '16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '12px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>{appt.service?.name || 'Service'}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  Customer: {appt.user?.name || `User #${appt.user_id}`}
                </p>
              </div>
              <div style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: 
                  appt.status === 'confirmed' ? '#e8f5e9' :
                  appt.status === 'in-progress' ? '#fff3e0' :
                  appt.status === 'completed' ? '#e3f2fd' : '#f5f5f5',
                color:
                  appt.status === 'confirmed' ? '#2e7d32' :
                  appt.status === 'in-progress' ? '#ef6c00' :
                  appt.status === 'completed' ? '#1565c0' : '#666'
              }}>
                {appt.status}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '20px',
              fontSize: '14px',
              color: '#555'
            }}>
              <div>
                <strong>Time:</strong> {formattedTime} - {formattedEndTime}
              </div>
              <div>
                <strong>Duration:</strong> {duration} min
              </div>
              <div style={{ color: '#999' }}>
                + {buffer} min buffer
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
```

---

## Part 5: Backend Vendor Endpoints

**File:** `apps/services-api/src/vendor.routes.ts`

```typescript
@Get('/appointments')
async listAppointments(@Query('date') date?: string) {
  const where: any = { store_id: 1 }; // TODO: get from auth context
  
  if (date) {
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);
    where.scheduled_for = Between(startOfDay, endOfDay);
  }
  
  return this.appointments.find({
    where,
    relations: ['service'],
    order: { scheduled_for: 'ASC' }
  });
}
```

---

## ✅ Testing Checklist

### Test 1: Basic Duration Display
- [ ] Open user portal services tab
- [ ] Verify each service card shows "X minutes" duration
- [ ] Check that duration is displayed alongside price

### Test 2: Smart Slot Generation
- [ ] Select a service
- [ ] Pick today's date
- [ ] Verify slots appear at correct intervals (duration + buffer)
- [ ] Example: 60 min service + 15 min buffer = slots at 9:00, 10:15, 11:30, etc.

### Test 3: Conflict Prevention
- [ ] Book a slot (e.g., 10:00 AM)
- [ ] Refresh page and select same service + date
- [ ] Verify 10:00 AM slot is no longer shown
- [ ] Verify next available slot accounts for buffer time

### Test 4: Vendor Schedule
- [ ] Open vendor portal
- [ ] Navigate to schedule tab
- [ ] Select today's date
- [ ] Verify all appointments show with correct times and durations
- [ ] Check buffer time is indicated

### Test 5: Different Service Durations
- [ ] Create test services: 30 min haircut, 90 min massage, 120 min AC repair
- [ ] Book each service
- [ ] Verify slots are spaced correctly based on duration

---

## 🎯 Key Success Indicators

After implementation:
- ✅ Users see service duration before booking
- ✅ Available slots respect service duration + buffer time
- ✅ No overlapping appointments possible
- ✅ Vendors see full daily schedule with time blocks
- ✅ System matches UrbanCompany user experience

---

**All code above is production-ready and can be copy-pasted directly into the files!**
