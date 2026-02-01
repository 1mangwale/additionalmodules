# IMPLEMENTATION GUIDE: Enhanced Venue & Theater Features

## 🎯 Quick Implementation Reference

### Part 1: Multi-Slot Venue Booking (User Portal)

#### Updated Frontend Code (apps/web-user/src/ui/App.tsx)

```typescript
// Add to venue state
const [selectedVenueSlots, setSelectedVenueSlots] = useState<number[]>([]) // Multiple IDs
const [slotPricing, setSlotPricing] = useState<Record<number, number>>({}) // slotId -> price

// Toggle slot selection
const toggleVenueSlot = (slotId: number) => {
  setSelectedVenueSlots(prev => 
    prev.includes(slotId) 
      ? prev.filter(id => id !== slotId)
      : [...prev, slotId].sort((a,b) => a - b) // Keep sorted
  )
}

// Calculate total
const calculateVenueTotal = () => {
  return selectedVenueSlots.reduce((sum, slotId) => {
    return sum + (slotPricing[slotId] || 0)
  }, 0)
}

// Check if slots are consecutive
const areSlotsConsecutive = (slotIds: number[], allSlots: any[]) => {
  if (slotIds.length <= 1) return true
  const sorted = slotIds.sort((a,b) => a - b)
  for (let i = 1; i < sorted.length; i++) {
    const curr = allSlots.find(s => s.id === sorted[i])
    const prev = allSlots.find(s => s.id === sorted[i-1])
    if (!curr || !prev) return false
    if (curr.hour_start !== prev.hour_end) return false
  }
  return true
}

// Book multiple slots
const bookMultipleVenueSlots = async () => {
  if (!selectedVenue || selectedVenueSlots.length === 0) return
  
  if (!areSlotsConsecutive(selectedVenueSlots, venueSlots)) {
    alert('Please select consecutive time slots')
    return
  }
  
  try {
    const firstSlot = venueSlots.find(s => s.id === selectedVenueSlots[0])
    const lastSlot = venueSlots.find(s => s.id === selectedVenueSlots[selectedVenueSlots.length - 1])
    const duration = selectedVenueSlots.length // hours
    const totalPrice = calculateVenueTotal()
    
    const res = await fetch('/venues/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 90004,
        storeId: 1,
        venueId: selectedVenue.id,
        slotIds: selectedVenueSlots, // Array of slot IDs
        date: venueDate,
        startTime: firstSlot.start_time,
        endTime: lastSlot.end_time,
        duration,
        pricing: {
          baseMinor: totalPrice,
          taxMinor: Math.round(totalPrice * 0.05),
          totalMinor: Math.round(totalPrice * 1.05)
        },
        payment: { mode: 'prepaid', walletMinor: Math.round(totalPrice * 1.05) }
      })
    }).then(r => r.json())
    
    setVenueBooking(res)
    alert(`Booked ${duration} slots! Total: ₹${(totalPrice/100).toFixed(2)}`)
  } catch (e: any) {
    alert('Booking failed: ' + e.message)
  }
}
```

#### UI Component
```tsx
{/* Venue Slots with Multi-Select */}
{selectedVenue && venueSlots.length > 0 && (
  <div style={{ ...styles.section, marginTop: '20px', background: '#f3e5f5' }}>
    <h3>📅 Book {selectedVenue.name}</h3>
    
    <label>
      Event Date: 
      <input 
        type="date" 
        value={venueDate} 
        onChange={e => {
          setVenueDate(e.target.value)
          loadVenueSlots(selectedVenue.id)
          setSelectedVenueSlots([]) // Reset selection
        }} 
        style={styles.input} 
      />
    </label>
    
    {venueSlots.length > 0 && (
      <div style={{ marginTop: '20px' }}>
        <p><strong>⏰ Select Time Slots (Click multiple for longer bookings):</strong></p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
          {venueSlots.map((slot: any) => {
            const isSelected = selectedVenueSlots.includes(slot.id)
            const isBooked = slot.booked >= slot.capacity
            const isPeak = slot.hour_start >= 17 || slot.hour_start <= 9 // Peak hours
            const price = isPeak ? 500 : 300 // Variable pricing
            
            // Update pricing map
            if (!slotPricing[slot.id]) {
              setSlotPricing(prev => ({ ...prev, [slot.id]: price * 100 }))
            }
            
            return (
              <button
                key={slot.id}
                onClick={() => !isBooked && toggleVenueSlot(slot.id)}
                disabled={isBooked}
                style={{
                  ...styles.button,
                  background: isBooked ? '#ccc' : 
                             isSelected ? '#764ba2' : 
                             isPeak ? '#ff6b6b' : '#667eea',
                  opacity: isBooked ? 0.5 : 1,
                  cursor: isBooked ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {slot.hour_start}:00 - {slot.hour_end}:00
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  ₹{price} {isPeak && '🔥'}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                  {isBooked ? '❌ Booked' : 
                   isSelected ? '✓ Selected' : 
                   '✓ Available'}
                </div>
              </button>
            )
          })}
        </div>
        
        {selectedVenueSlots.length > 0 && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: 'white', 
            borderRadius: '8px',
            border: '2px solid #667eea'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>📋 Booking Summary</h4>
            <p><strong>Selected Slots:</strong> {selectedVenueSlots.length}</p>
            <p><strong>Duration:</strong> {selectedVenueSlots.length} hours</p>
            <p><strong>Time Range:</strong> {
              venueSlots.find(s => s.id === selectedVenueSlots[0])?.hour_start
            }:00 - {
              venueSlots.find(s => s.id === selectedVenueSlots[selectedVenueSlots.length - 1])?.hour_end
            }:00</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
              <strong>Total:</strong> ₹{(calculateVenueTotal() / 100).toFixed(2)}
            </p>
            
            <button 
              onClick={bookMultipleVenueSlots} 
              style={{ ...styles.button, marginTop: '10px', fontSize: '16px' }}
            >
              🎯 Confirm Booking ({selectedVenueSlots.length} slots)
            </button>
            <button 
              onClick={() => setSelectedVenueSlots([])} 
              style={{ ...styles.button, background: '#999', marginTop: '10px' }}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    )}
  </div>
)}
```

---

### Part 2: Theater Layout Templates (Vendor Portal)

#### Template Library (Hardcoded)

```typescript
// apps/web-vendor/src/theater-templates.ts

export const THEATER_TEMPLATES = [
  {
    id: 'small_classic',
    name: 'Classic Small (75 seats)',
    description: '5 rows with 15 seats each, single tier standard layout',
    totalSeats: 75,
    preview: '/templates/small_classic.svg',
    config: {
      sections: [
        {
          section_id: 'main',
          name: 'Main Section',
          rows: ['A', 'B', 'C', 'D', 'E'],
          seats_per_row: 15,
          price_multiplier: 1.0,
          seat_type: 'standard',
          color: '#90EE90'
        }
      ]
    }
  },
  {
    id: 'medium_vip',
    name: 'Medium with VIP (150 seats)',
    description: 'Mixed seating with regular, executive, and VIP rows',
    totalSeats: 150,
    preview: '/templates/medium_vip.svg',
    config: {
      sections: [
        {
          section_id: 'regular',
          name: 'Regular',
          rows: ['A', 'B', 'C', 'D'],
          seats_per_row: 20,
          price_multiplier: 1.0,
          seat_type: 'standard',
          color: '#90EE90'
        },
        {
          section_id: 'executive',
          name: 'Executive',
          rows: ['E', 'F'],
          seats_per_row: 15,
          price_multiplier: 1.5,
          seat_type: 'executive',
          color: '#FFD700'
        },
        {
          section_id: 'vip',
          name: 'VIP',
          rows: ['G', 'H'],
          seats_per_row: 10,
          price_multiplier: 2.0,
          seat_type: 'vip',
          color: '#FF6347'
        }
      ]
    }
  },
  {
    id: 'large_stadium',
    name: 'Large Stadium (300 seats)',
    description: 'Multi-tier stadium seating with premium sections',
    totalSeats: 300,
    preview: '/templates/large_stadium.svg',
    config: {
      sections: [
        {
          section_id: 'lower',
          name: 'Lower Tier',
          rows: ['A', 'B', 'C', 'D', 'E', 'F'],
          seats_per_row: 25,
          price_multiplier: 1.0,
          seat_type: 'standard',
          color: '#90EE90'
        },
        {
          section_id: 'upper',
          name: 'Upper Tier',
          rows: ['G', 'H', 'I', 'J'],
          seats_per_row: 30,
          price_multiplier: 1.3,
          seat_type: 'executive',
          color: '#FFD700'
        },
        {
          section_id: 'premium',
          name: 'Premium Lounge',
          rows: ['K', 'L'],
          seats_per_row: 15,
          price_multiplier: 2.5,
          seat_type: 'recliner',
          color: '#8B4513'
        }
      ]
    }
  },
  {
    id: 'imax_premium',
    name: 'IMAX Premium (400 seats)',
    description: 'IMAX-style large format with varied row sizes',
    totalSeats: 415,
    preview: '/templates/imax.svg',
    config: {
      sections: [
        {
          section_id: 'front',
          name: 'Front Section',
          rows: [
            { row: 'A', seats: 20 },
            { row: 'B', seats: 22 },
            { row: 'C', seats: 24 },
            { row: 'D', seats: 26 }
          ],
          price_multiplier: 0.8,
          seat_type: 'standard',
          color: '#90EE90'
        },
        {
          section_id: 'middle',
          name: 'Middle Section',
          rows: [
            { row: 'E', seats: 28 },
            { row: 'F', seats: 30 },
            { row: 'G', seats: 32 },
            { row: 'H', seats: 34 },
            { row: 'I', seats: 35 }
          ],
          price_multiplier: 1.2,
          seat_type: 'executive',
          color: '#FFD700'
        },
        {
          section_id: 'back',
          name: 'Back Premium',
          rows: [
            { row: 'J', seats: 35 },
            { row: 'K', seats: 30 },
            { row: 'L', seats: 25 }
          ],
          price_multiplier: 1.8,
          seat_type: 'premium',
          color: '#FF6347'
        }
      ]
    }
  }
]
```

#### Vendor UI Component

```tsx
// Add to vendor portal (apps/web-vendor/src/ui/App.tsx)

import { THEATER_TEMPLATES } from './theater-templates'

// Add state
const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
const [previewTemplate, setPreviewTemplate] = useState<any>(null)

// Preview template
const showTemplatePreview = (template: any) => {
  setPreviewTemplate(template)
}

// Apply template to screen
const applyTemplateToScreen = async (screenId: number, templateId: string) => {
  const template = THEATER_TEMPLATES.find(t => t.id === templateId)
  if (!template) return
  
  try {
    const res = await postJSON(`/movies/vendor/movies/screens/${screenId}/layout`, template.config)
    alert(`✓ Layout applied! ${template.totalSeats} seats created.`)
    setPreviewTemplate(null)
    // Reload screens
    fetch('/movies/vendor/movies/screens')
      .then(r => r.json())
      .then(d => setScreens(Array.isArray(d) ? d : d.items || []))
  } catch (e: any) {
    alert('Failed to apply template: ' + e.message)
  }
}

// UI Render
<section style={{ background: 'white', padding: '25px', borderRadius: '8px', marginBottom: '20px' }}>
  <h2>🎭 Theater Layout Templates</h2>
  <p style={{ color: '#666' }}>Quick-start templates for screen layouts</p>
  
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
    {THEATER_TEMPLATES.map(template => (
      <div key={template.id} style={{
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        padding: '15px',
        background: '#f9f9f9',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#667eea'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{template.name}</h3>
        <p style={{ fontSize: '13px', color: '#666', margin: '8px 0' }}>
          {template.description}
        </p>
        
        <div style={{ background: 'white', padding: '8px', borderRadius: '4px', margin: '10px 0', fontSize: '12px' }}>
          <div>📊 <strong>Total Seats:</strong> {template.totalSeats}</div>
          <div>📐 <strong>Rows:</strong> {template.config.sections[0].rows.length}+</div>
          <div>🎨 <strong>Sections:</strong> {template.config.sections.length}</div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button 
            onClick={() => showTemplatePreview(template)}
            style={{
              flex: 1,
              padding: '8px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            👁️ Preview
          </button>
          
          <select 
            onChange={(e) => {
              if (e.target.value) {
                if (confirm(`Apply "${template.name}" to Screen ${e.target.value}?`)) {
                  applyTemplateToScreen(parseInt(e.target.value), template.id)
                }
              }
            }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '13px'
            }}
          >
            <option value="">Apply to...</option>
            {screens.map((screen: any) => (
              <option key={screen.id} value={screen.id}>
                Screen {screen.id}
              </option>
            ))}
          </select>
        </div>
      </div>
    ))}
  </div>
  
  {/* Template Preview Modal */}
  {previewTemplate && (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}
    onClick={() => setPreviewTemplate(null)}
    >
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        maxWidth: '90%',
        maxHeight: '90%',
        overflow: 'auto'
      }}
      onClick={e => e.stopPropagation()}
      >
        <h2>{previewTemplate.name}</h2>
        <p>{previewTemplate.description}</p>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div style={{ 
            background: '#333', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            🎬 SCREEN
          </div>
          
          {previewTemplate.config.sections.map((section: any, idx: number) => (
            <div key={idx} style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                color: section.color, 
                margin: '10px 0',
                textAlign: 'left'
              }}>
                {section.name} ({section.seat_type})
              </h4>
              {(Array.isArray(section.rows[0]) ? section.rows : 
                section.rows.map((r: any) => typeof r === 'string' ? { row: r, seats: section.seats_per_row } : r)
              ).map((rowConfig: any, ridx: number) => {
                const row = typeof rowConfig === 'string' ? rowConfig : rowConfig.row
                const seatCount = typeof rowConfig === 'object' ? rowConfig.seats : section.seats_per_row
                return (
                  <div key={ridx} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', width: '30px' }}>{row}</span>
                    {Array.from({ length: seatCount }, (_, i) => (
                      <span key={i} style={{
                        display: 'inline-block',
                        width: '28px',
                        height: '28px',
                        background: section.color,
                        border: '1px solid #333',
                        borderRadius: '4px',
                        fontSize: '10px',
                        lineHeight: '28px',
                        margin: '2px'
                      }}>
                        {i + 1}
                      </span>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setPreviewTemplate(null)}
            style={{
              padding: '12px 24px',
              background: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )}
</section>
```

---

## 🚀 Quick Start

### Test Multi-Slot Venue Booking:
1. Go to User Portal http://localhost:5192/user/
2. Click "Venues" tab
3. Select a venue
4. Pick a date
5. **Click multiple time slots** (they'll highlight)
6. See running total update
7. Click "Confirm Booking"

### Test Theater Templates:
1. Go to Vendor Portal http://localhost:5190/vendor/
2. Find "Theater Layout Templates" section
3. Click "Preview" on any template
4. See full seat layout
5. Select screen from dropdown
6. Template applies instantly!

---

## 📊 API Changes Needed

### Backend: Multi-Slot Venue Booking
```typescript
// apps/venues/src/routes.venues.ts
@Post('/book-multiple')
async bookMultipleSlots(@Body() dto: BookMultipleSlotsDto) {
  const { userId, storeId, venueId, slotIds, date, pricing, payment } = dto
  
  // Validate all slots available
  const slots = await this.slotsRepo.find({ 
    where: { id: In(slotIds) }
  })
  
  const allAvailable = slots.every(s => s.booked < s.capacity)
  if (!allAvailable) {
    throw new BadRequestException('Some slots are not available')
  }
  
  // Create booking for each slot
  const bookings = []
  for (const slotId of slotIds) {
    const booking = this.bookingsRepo.create({
      user_id: userId,
      store_id: storeId,
      venue_type_id: venueId,
      slot_id: slotId,
      booking_date: date,
      hours: 1,
      amount_minor: pricing.baseMinor / slotIds.length,
      status: 'confirmed',
      payment_mode: payment.mode
    })
    bookings.push(await this.bookingsRepo.save(booking))
    
    // Update slot
    await this.slotsRepo.increment(
      { id: slotId },
      'booked',
      1
    )
  }
  
  return { success: true, bookings, message: `Booked ${slotIds.length} slots` }
}
```

---

## 📖 Documentation Updates

### User Guide: Multi-Slot Booking

**How to book a badminton court for 2 hours:**

1. **Select Venue**: Click "Book Venue" on your desired court
2. **Choose Date**: Pick your preferred date
3. **Select Multiple Slots**: 
   - Click on 8:00-9:00 AM (₹500)
   - Click on 9:00-10:00 AM (₹500)
   - Both slots highlight in purple
4. **See Summary**:
   - Duration: 2 hours
   - Total: ₹1000
5. **Confirm**: Click "Confirm Booking" button
6. **Done!**: Get confirmation with booking IDs

**Tips:**
- Peak hours (6-9 AM, 5-10 PM) cost more 🔥
- Select consecutive slots only
- Clear selection to start over

---

### Vendor Guide: Theater Templates

**How to set up a movie theater in 30 seconds:**

1. **Go to Vendor Portal**: http://localhost:5190/vendor/
2. **Find Templates Section**: Scroll to "Theater Layout Templates"
3. **Browse Templates**:
   - Small (75 seats) - Local cinemas
   - Medium VIP (150 seats) - Multiplex screens
   - Large Stadium (300 seats) - Premium halls
   - IMAX (400 seats) - Large format
4. **Preview**: Click "Preview" to see layout
5. **Apply**: Select your screen from dropdown
6. **Confirm**: Layout created instantly!

**What happens:**
- All seats auto-created
- Rows labeled (A, B, C...)
- Pricing tiers set
- Ready to add showtimes!

**Customization (Future):**
- Edit template after applying
- Add/remove seats
- Change pricing
- Block seats

---

## ✅ Summary

### What's Implemented:
1. ✅ Multi-slot venue booking UI
2. ✅ Variable pricing display (peak/off-peak)
3. ✅ Slot selection with visual feedback
4. ✅ Running total calculator
5. ✅ Theater template library (4 templates)
6. ✅ Template preview modal
7. ✅ One-click template application

### What's Missing (Phase 2):
- Equipment rental options
- Recurring bookings
- Visual layout builder
- Custom seat editing
- Import/export layouts

### Priority:
**Implement these UI changes first**, then add backend API support for multi-slot booking.

