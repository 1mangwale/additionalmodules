# COMPREHENSIVE VENUE & THEATER ANALYSIS

## Real-World Apps Research

### 🏀 Playo (Sports Venue Booking)
**URL:** https://www.playo.co

**Key Features:**
1. **Multi-Slot Booking**
   - Book multiple hours at once (e.g., 2-hour badminton session)
   - Each slot shows: Time + Price + Availability
   - Can book consecutive slots with one click

2. **Variable Pricing**
   - Peak hours (₹500/hour): 6-9 AM, 5-10 PM
   - Off-peak hours (₹300/hour): 9 AM-5 PM
   - Weekend surge pricing (+20%)
   - Holiday pricing (+30%)

3. **Venue Types**
   - Badminton courts
   - Cricket turfs
   - Football grounds
   - Tennis courts
   - Swimming pools
   - Gaming zones

4. **Booking Flow**
   ```
   Select Sport → Choose Venue → Pick Date 
   → See all slots (color-coded) 
   → Select multiple slots 
   → See total price 
   → Add equipment rental (optional)
   → Confirm booking
   ```

5. **Slot Display**
   ```
   🟢 Available (₹300)
   🟡 Few left (₹400)  
   🔴 Booked
   🔵 Your booking
   ```

6. **Additional Services**
   - Equipment rental (rackets, balls)
   - Coaching sessions
   - Tournament hosting
   - Photography services
   - Referee booking

---

## 🎬 BookMyShow (Movie Theater)
**Theater Layout Features:**

### Vendor Setup:
1. **Screen Creation**
   - Screen name (Screen 1, IMAX, 4DX)
   - Total capacity
   - Screen type
   - Sound system

2. **Layout Templates** ⭐
   ```
   Small Theater (50-100 seats):
   - 5 rows (A-E)
   - 10-20 seats per row
   - Single tier
   
   Medium Theater (100-200 seats):
   - 8 rows (A-H)
   - 12-25 seats per row
   - Optional: VIP rows
   
   Large Theater (200-400 seats):
   - 12+ rows (A-L)
   - 20-35 seats per row
   - Multiple tiers (Balcony, Gallery)
   - VIP lounges
   
   IMAX/Premium (300-500 seats):
   - Stadium seating
   - Recliners
   - VIP sections
   - Food court integration
   ```

3. **Seat Types & Pricing**
   - Regular (₹150)
   - Executive (₹200)
   - Premium/Recliner (₹350)
   - VIP Lounge (₹500)
   - Couple seats (₹600)

4. **Layout Builder** ⭐ Critical Feature
   ```
   Visual Grid:
   [A1] [A2] [A3] ... [A20]
   [B1] [B2] [B3] ... [B20]
   
   Actions:
   - Click to add/remove seat
   - Drag to select multiple
   - Set section (Regular/Premium)
   - Create aisles
   - Add wheelchair spots
   - Block seats (pillar, tech)
   ```

5. **Pre-made Templates** ⭐ What We Need
   ```json
   {
     "small_classic": {
       "name": "Classic Small (75 seats)",
       "rows": ["A","B","C","D","E"],
       "seats_per_row": 15,
       "aisles": [7],
       "pricing": "uniform"
     },
     "medium_tiered": {
       "name": "Medium with VIP (150 seats)",
       "sections": [
         {"rows": ["A","B","C"], "seats": 20, "type": "regular"},
         {"rows": ["D","E"], "seats": 15, "type": "premium"},
         {"rows": ["F","G"], "seats": 10, "type": "vip"}
       ]
     },
     "large_imax": {
       "name": "IMAX Large (300 seats)",
       "sections": [
         {"rows": ["A","B","C","D"], "seats": 25, "type": "regular"},
         {"rows": ["E","F","G","H"], "seats": 30, "type": "executive"},
         {"rows": ["I","J"], "seats": 20, "type": "recliner"}
       ]
     }
   }
   ```

---

## 📊 Gap Analysis: What We Have vs Need

### VENUES Module

#### ✅ Current Features:
- Basic venue types (name, category, description)
- Hourly slots (hour_start, hour_end)
- Single slot booking
- Flat pricing (hourly_rate_minor)

#### ❌ Missing Features:
1. **Multi-Slot Booking**
   - Can't book multiple consecutive hours
   - No bulk selection
   - No cart system

2. **Variable Pricing**
   - Only flat hourly rate
   - No peak/off-peak
   - No dynamic pricing

3. **Slot Features**
   - No equipment rental
   - No recurring bookings
   - No team formation
   - No waitlist

4. **Venue Details**
   - No photos
   - No facility details (changing rooms, parking)
   - No court/field numbers
   - No reviews

---

### MOVIES Module

#### ✅ Current Features:
- Screen entity (name, seat_count)
- Showtime management
- Basic seat layout (screen_seat table)
- Seat booking status

#### ❌ Missing Features:
1. **Layout Templates** ⭐ CRITICAL
   - No pre-made templates
   - Vendors must manually create every seat
   - No quick setup option

2. **Visual Layout Builder** ⭐ CRITICAL
   - No drag-drop interface
   - No visual seat preview
   - Can't see layout before saving

3. **Layout Features**
   - No aisle management
   - No wheelchair accessibility
   - No couple seat pairs
   - No blocked seat types

4. **Pricing Tiers**
   - Basic pricing per showtime
   - No section-based pricing
   - No seat type differentiation

---

## 🎯 Industry Standard Requirements

### Venue Booking (Playo Standard):

1. **Core Features**
   ✅ Date selection
   ✅ Time slots
   ❌ Multi-slot selection ⭐ MUST HAVE
   ❌ Variable pricing ⭐ MUST HAVE
   ❌ Equipment rental
   ❌ Recurring bookings

2. **Pricing Models**
   ```
   Flat Rate: ₹300/hour (all times)
   Variable: ₹300 off-peak, ₹500 peak
   Dynamic: Based on demand
   Package: 10 hours for ₹2500
   ```

3. **User Experience**
   ```
   View Calendar → See all slots 
   → Multi-select (click multiple) 
   → See running total 
   → Add-ons (equipment) 
   → Payment → Confirmation
   ```

---

### Theater Layout (BookMyShow Standard):

1. **Setup Methods** ⭐
   ```
   Method 1: Quick Start (Templates)
   - Choose template (Small/Medium/Large)
   - Auto-generates layout
   - Vendor can edit after
   
   Method 2: Custom Build
   - Start blank
   - Add rows manually
   - Place seats individually
   - Set pricing zones
   
   Method 3: Import
   - Upload JSON/CSV
   - Validate and preview
   - Bulk create
   ```

2. **Template Library** ⭐ MUST HAVE
   ```javascript
   {
     templates: [
       {
         id: "small_50",
         name: "Small Theater (50 seats)",
         description: "5 rows, 10 seats each",
         config: { /* layout */ }
       },
       {
         id: "medium_150",
         name: "Medium Hall (150 seats)",
         description: "10 rows, 15 seats each",
         config: { /* layout */ }
       },
       {
         id: "large_300",
         name: "Large Auditorium (300 seats)",
         description: "Stadium seating with VIP",
         config: { /* layout */ }
       },
       {
         id: "imax_400",
         name: "IMAX (400 seats)",
         description: "Premium tiered seating",
         config: { /* layout */ }
       }
     ]
   }
   ```

3. **Layout Builder UI** ⭐
   ```
   [Visual Grid Display]
   
   Tools:
   - Add Row button
   - Remove Row button
   - Seats per row slider
   - Seat type selector
   - Price zone painter
   - Aisle creator
   - Preview mode
   
   Right Panel:
   - Template gallery
   - Quick actions
   - Stats (total seats, by type)
   - Pricing summary
   ```

---

## 🚀 Implementation Priority

### Phase 1 (Critical - Now):

#### Venues:
1. ✅ Multi-slot selection UI
2. ✅ Variable pricing (peak/off-peak)
3. ✅ Slot aggregation (book 2-3 hours)
4. ✅ Price calculation display
5. ❌ Equipment rental (later)

#### Movies:
1. ✅ Template library (4-5 templates)
2. ✅ One-click template application
3. ✅ Template preview
4. ❌ Visual builder (Phase 2)

### Phase 2 (Important - Next):

#### Venues:
1. Recurring bookings (weekly badminton)
2. Team formation
3. Equipment rental
4. Venue photos

#### Movies:
1. Drag-drop layout builder
2. Visual seat editing
3. Aisle management
4. Wheelchair spots

### Phase 3 (Nice to Have):

#### Venues:
1. Package deals
2. Coaching integration
3. Tournament hosting
4. Group bookings

#### Movies:
1. Import/Export layouts
2. Copy from another screen
3. 3D preview
4. Food combo integration

---

## 📋 Technical Implementation

### 1. Venue Multi-Slot Booking

#### Database (Current):
```sql
venue_slots (
  id, venue_type_id, store_id, date,
  hour_start, hour_end, capacity, booked, status
)
```

#### API Enhancement:
```typescript
// Allow booking multiple slots
POST /venues/book-multiple
{
  userId: 123,
  venueId: 5,
  date: "2026-05-15",
  slotIds: [10, 11, 12], // 3 consecutive hours
  equipment: ["racket", "shuttlecock"],
  pricing: {
    slotsTotal: 150000, // ₹1500
    equipmentTotal: 10000, // ₹100
    taxTotal: 8000,
    grandTotal: 168000
  }
}
```

#### UI Changes:
```tsx
// Multi-select slots
{slots.map(slot => (
  <button 
    onClick={() => toggleSlot(slot.id)}
    className={selectedSlots.includes(slot.id) ? 'selected' : ''}
  >
    {slot.time} - ₹{slot.price}
    {selectedSlots.includes(slot.id) && '✓'}
  </button>
))}

<div className="booking-summary">
  <p>Selected: {selectedSlots.length} slots</p>
  <p>Duration: {selectedSlots.length} hours</p>
  <p>Total: ₹{calculateTotal()}</p>
</div>
```

---

### 2. Theater Layout Templates

#### Template Storage:
```typescript
// Built-in templates (hardcoded or DB)
const LAYOUT_TEMPLATES = {
  small_classic: {
    id: 'small_classic',
    name: 'Classic Small (75 seats)',
    rows: ['A','B','C','D','E'],
    seatsPerRow: 15,
    aisles: [7, 8], // Aisle after seat 7 & 8
    sections: [
      { rows: ['A','B','C'], type: 'regular', price: 150 },
      { rows: ['D','E'], type: 'premium', price: 200 }
    ]
  },
  medium_vip: {
    id: 'medium_vip',
    name: 'Medium with VIP (150 seats)',
    rows: ['A','B','C','D','E','F','G','H'],
    sections: [
      { rows: ['A','B','C','D'], seatsPerRow: 20, type: 'regular' },
      { rows: ['E','F'], seatsPerRow: 15, type: 'executive' },
      { rows: ['G','H'], seatsPerRow: 10, type: 'vip' }
    ]
  },
  large_stadium: {
    id: 'large_stadium',
    name: 'Large Stadium (300 seats)',
    tiers: [
      {
        name: 'Lower Tier',
        rows: ['A','B','C','D','E','F'],
        seatsPerRow: 25,
        type: 'regular'
      },
      {
        name: 'Upper Tier',
        rows: ['G','H','I','J'],
        seatsPerRow: 30,
        type: 'executive'
      },
      {
        name: 'VIP Lounge',
        rows: ['K','L'],
        seatsPerRow: 15,
        type: 'recliner'
      }
    ]
  },
  imax_premium: {
    id: 'imax_premium',
    name: 'IMAX Premium (400 seats)',
    stadiumSeating: true,
    rows: ['A','B','C','D','E','F','G','H','I','J','K','L'],
    seatsPerRow: [20,22,24,26,28,30,32,34,35,35,30,25],
    sections: [
      { rows: ['A','B','C','D'], type: 'standard' },
      { rows: ['E','F','G','H','I'], type: 'executive' },
      { rows: ['J','K','L'], type: 'premium' }
    ]
  }
}
```

#### Vendor UI:
```tsx
// Template Selection
<div className="template-gallery">
  {templates.map(template => (
    <div className="template-card">
      <img src={template.preview} />
      <h3>{template.name}</h3>
      <p>{template.description}</p>
      <ul>
        <li>Capacity: {template.totalSeats}</li>
        <li>Rows: {template.rows.length}</li>
        <li>Types: {template.seatTypes.join(', ')}</li>
      </ul>
      <button onClick={() => applyTemplate(template.id)}>
        Use This Template
      </button>
    </div>
  ))}
</div>

// Preview before applying
<div className="layout-preview">
  <div className="screen-indicator">SCREEN</div>
  {template.rows.map(row => (
    <div className="row">
      <span className="row-label">{row}</span>
      {generateSeats(row, template).map(seat => (
        <span className={`seat ${seat.type}`}>
          {seat.number}
        </span>
      ))}
    </div>
  ))}
</div>

<button onClick={applyTemplate}>
  ✓ Apply This Layout to Screen
</button>
```

---

## 🎨 UI/UX Best Practices

### Venue Booking:

1. **Calendar View**
   - Week/Month toggle
   - Highlight available dates
   - Show price trends

2. **Slot Grid**
   - Color-coded by availability
   - Show price on each slot
   - Highlight selection
   - Show running total

3. **Multi-Select**
   - Click to toggle
   - Ctrl+Click for non-consecutive
   - "Select All Morning" button
   - "Clear Selection" button

4. **Summary Panel**
   - Selected slots list
   - Duration display
   - Price breakdown
   - Equipment options
   - Total amount (bold)

---

### Theater Layout:

1. **Template Gallery**
   - Visual preview cards
   - Capacity badge
   - Quick stats
   - "Preview" button
   - "Use Template" button

2. **Layout Preview**
   - Full seat map
   - Color by type
   - Zoom controls
   - Pan/scroll
   - Seat count display

3. **Builder (Phase 2)**
   - Tools sidebar
   - Grid canvas
   - Right-click context menu
   - Keyboard shortcuts
   - Undo/Redo

4. **Confirmation**
   - Summary stats
   - Preview one more time
   - Edit option
   - Save button (prominent)

---

## 📦 Deliverables for This Sprint

### Immediate (Today):

1. **Venue Multi-Slot Booking** ✅
   - Frontend: Multi-select checkboxes
   - Running total calculator
   - Book multiple slots API call
   - Confirmation with breakdown

2. **Variable Pricing Display** ✅
   - Show price per slot
   - Highlight peak/off-peak
   - Calculate total dynamically

3. **Theater Template System** ✅
   - 4 hardcoded templates
   - Template preview component
   - Apply template button
   - Success confirmation

### Documentation:
- ✅ This analysis file
- ✅ User guide for multi-slot
- ✅ Vendor guide for templates
- ✅ API documentation updates

---

## 🔗 Reference URLs

- Playo: https://www.playo.co
- BookMyShow: https://in.bookmyshow.com
- Urban Sports Club: https://urbansportsclub.com
- PlaySpot: https://playspot.co.in
- Hudle: https://www.hudle.in

---

## Summary

**Venue Booking:**
- ✅ Multi-slot selection (like Playo)
- ✅ Variable pricing display
- ✅ Total calculation
- 🔄 Equipment rental (Phase 2)
- 🔄 Recurring bookings (Phase 2)

**Theater Layout:**
- ✅ 4 pre-made templates
- ✅ One-click apply
- ✅ Preview before applying
- 🔄 Visual builder (Phase 2)
- 🔄 Custom editing (Phase 2)

**Priority:** Implement multi-slot venue booking + theater templates TODAY.
**Phase 2:** Visual builders, equipment rental, advanced features.

