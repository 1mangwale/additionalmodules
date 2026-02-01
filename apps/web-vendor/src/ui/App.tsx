import { useEffect, useState } from 'react'

function postJSON(url: string, body: any) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json())
}

const field = { margin: '4px 0' }
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }
const card: React.CSSProperties = { border: '1px solid #ddd', padding: 12, borderRadius: 8, marginTop: 12 }

export function App() {
  const [vendorStoreId, setVendorStoreId] = useState(1)
  const [vendorStatus, setVendorStatus] = useState('')
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [slotsList, setSlotsList] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  // Movies state
  const [movies, setMovies] = useState<any[]>([])
  const [screens, setScreens] = useState<any[]>([])
  const [showtimes, setShowtimes] = useState<any[]>([])
  // Venues state
  const [venues, setVenues] = useState<any[]>([])
  const [venueSlots, setVenueSlots] = useState<any[]>([])
  // Vendor bookings state
  const [roomBookings, setRoomBookings] = useState<any[]>([])
  const [serviceAppointments, setServiceAppointments] = useState<any[]>([])
  const [movieBookings, setMovieBookings] = useState<any[]>([])
  const [venueBookings, setVenueBookings] = useState<any[]>([])

  // Room Type form state
  const [rt, setRt] = useState({ store_id: 1, name: '', occupancy_adults: 2, occupancy_children: 0 })
  const [rp, setRp] = useState({ room_type_id: 1, name: '', refundable: true, pricing_mode: 'flat' })
  // Service form state
  const [svc, setSvc] = useState({ store_id: 1, name: '', category: 'general', pricing_model: 'dynamic', base_price: 0, visit_fee: 0, at_customer_location: true, status: 1, duration_min: 60, buffer_time_min: 15 })
  // Slot form state
  const [slot, setSlot] = useState({ store_id: 1, date: '', start_time: '10:00:00', end_time: '12:00:00', capacity: 1 })
  // Movies advanced
  const [layoutScreenId, setLayoutScreenId] = useState(1)
  const [layoutJson, setLayoutJson] = useState<string>('')
  const [showtimePricing, setShowtimePricing] = useState({ showtime_id: 1, section_id: 'A', price_minor: 20000 })

  useEffect(() => {
    fetch('/rooms/vendor/rooms/room-types')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : []))
      .then(setRoomTypes)
      .catch(() => { })
    fetch('/rooms/vendor/rooms/rate-plans')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : []))
      .then(setRatePlans)
      .catch(() => { })
    fetch('/rooms/vendor/rooms/inventory')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : []))
      .then(setInventory)
      .catch(() => { })
    fetch('/services/vendor/services/catalog')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : []))
      .then(setServices)
      .catch(() => { })
    fetch('/services/vendor/services/slots')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : []))
      .then(setSlotsList)
      .catch(() => { })
    // Movies
    fetch('/movies/vendor/movies/catalog').then(r => r.json()).then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : [])).then(setMovies).catch(() => { })
    fetch('/movies/vendor/movies/screens').then(r => r.json()).then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : [])).then(setScreens).catch(() => { })
    fetch('/movies/vendor/movies/showtimes').then(r => r.json()).then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : [])).then(setShowtimes).catch(() => { })
    // Venues
    fetch('/venues/vendor/venues/catalog').then(r => r.json()).then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : [])).then(setVenues).catch(() => { })
    fetch('/venues/vendor/venues/slots').then(r => r.json()).then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : [])).then(setVenueSlots).catch(() => { })
  }, [])

  const submitRoomType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rt.name.trim()) return
    const created = await postJSON('/rooms/vendor/rooms/room-types', { ...rt, store_id: vendorStoreId })
    setRoomTypes(prev => [created, ...prev])
    setRt({ store_id: rt.store_id, name: '', occupancy_adults: 2, occupancy_children: 0 })
  }

  const submitRatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rp.name.trim()) return
    const created = await postJSON('/rooms/vendor/rooms/rate-plans', rp)
    setRatePlans(prev => [created, ...prev])
    setRp({ room_type_id: rp.room_type_id, name: '', refundable: true, pricing_mode: 'flat' })
  }

  const submitService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!svc.name.trim()) return
    const created = await postJSON('/services/vendor/services/catalog', { ...svc, store_id: vendorStoreId })
    setServices(prev => [created, ...prev])
    setSvc({ store_id: svc.store_id, name: '', category: 'general', pricing_model: 'dynamic', base_price: 0, visit_fee: 0, at_customer_location: true, status: 1, duration_min: 60, buffer_time_min: 15 })
  }

  // Room inventory: add/refresh
  const [inv, setInv] = useState({ room_type_id: 1, date: '', total_rooms: 5, price_override: '' as any })
  const submitInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inv.date) return
    const payload: any = { room_type_id: Number(inv.room_type_id), date: inv.date, total_rooms: Number(inv.total_rooms) }
    if (inv.price_override !== '' && !Number.isNaN(Number(inv.price_override))) payload.price_override = Number(inv.price_override)
    await postJSON('/rooms/vendor/rooms/inventory', payload)
    const refreshed = await fetch('/rooms/vendor/rooms/inventory')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : []))
      .catch(() => [])
    setInventory(refreshed as any[])
  }

  const submitSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slot.date) return
    await postJSON('/services/vendor/services/slots', { ...slot, store_id: vendorStoreId })
    const refreshed = await fetch('/services/vendor/services/slots')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : []))
      .catch(() => [])
    setSlotsList(refreshed as any[])
  }

  // Movies forms
  const [mv, setMv] = useState({ store_id: 1, title: '', genre: '', duration_min: 120, buffer_time_min: 20, language: 'English' })
  const [scr, setScr] = useState({ store_id: 1, name: '', seat_count: 100 })
  const [st, setSt] = useState({ store_id: 1, movie_id: 1, screen_id: 1, starts_at: '', base_price: 200 })
  const addMovie = async (e: React.FormEvent) => { e.preventDefault(); const created = await postJSON('/movies/vendor/movies/catalog', { ...mv, store_id: vendorStoreId }); setMovies(p => [created, ...p]); setMv({ store_id: mv.store_id, title: '', genre: '', duration_min: 120, buffer_time_min: 20, language: 'English' }) }
  const addScreen = async (e: React.FormEvent) => { e.preventDefault(); const created = await postJSON('/movies/vendor/movies/screens', { ...scr, store_id: vendorStoreId }); setScreens(p => [created, ...p]); setScr({ store_id: scr.store_id, name: '', seat_count: 100 }) }
  const addShowtime = async (e: React.FormEvent) => { e.preventDefault(); const created = await postJSON('/movies/vendor/movies/showtimes', { ...st, store_id: vendorStoreId, starts_at: new Date(st.starts_at).toISOString() }); setShowtimes(p => [created, ...p]); }

  const deleteSlot = async (id: number) => {
    await fetch(`/services/vendor/services/slots/${id}`, { method: 'DELETE' })
    setSlotsList(prev => prev.filter(s => s.id !== id))
  }

  const loadVendorBookings = async () => {
    const storeId = vendorStoreId
    const status = vendorStatus ? `&status=${encodeURIComponent(vendorStatus)}` : ''
    const rooms = await fetch(`/rooms/vendor/rooms/bookings?storeId=${storeId}${status}`).then(r => r.json()).catch(() => [])
    const servicesAppts = await fetch(`/services/vendor/services/appointments?storeId=${storeId}${status}`).then(r => r.json()).catch(() => [])
    const moviesBk = await fetch(`/movies/vendor/movies/bookings?storeId=${storeId}${status}`).then(r => r.json()).catch(() => [])
    const venuesBk = await fetch(`/venues/vendor/venues/bookings?storeId=${storeId}${status}`).then(r => r.json()).catch(() => [])
    setRoomBookings(Array.isArray(rooms) ? rooms : (rooms?.items || []))
    setServiceAppointments(Array.isArray(servicesAppts) ? servicesAppts : (servicesAppts?.items || []))
    setMovieBookings(Array.isArray(moviesBk) ? moviesBk : (moviesBk?.items || []))
    setVenueBookings(Array.isArray(venuesBk) ? venuesBk : (venuesBk?.items || []))
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 16 }}>
      <h1>Mangwale — Vendor Admin</h1>

      <section style={{ marginTop: 8 }}>
        <h2>Vendor Tools</h2>
        <div style={row}>
          <label>Store ID<input style={field} type="number" value={vendorStoreId} onChange={e => setVendorStoreId(Number(e.target.value))} /></label>
          <label>Status (optional)<input style={field} type="text" value={vendorStatus} onChange={e => setVendorStatus(e.target.value)} placeholder="confirmed" /></label>
          <button onClick={loadVendorBookings}>Load Vendor Bookings</button>
        </div>
      </section>

      <section>
        <h2>Room Types</h2>
        <form onSubmit={submitRoomType} style={card}>
          <div style={row}>
            <label>Store ID<input style={field} type="number" value={rt.store_id} onChange={e => setRt({ ...rt, store_id: Number(e.target.value) })} /></label>
            <label>Name<input style={field} type="text" value={rt.name} onChange={e => setRt({ ...rt, name: e.target.value })} placeholder="Deluxe Room" /></label>
            <label>Adults<input style={field} type="number" value={rt.occupancy_adults} onChange={e => setRt({ ...rt, occupancy_adults: Number(e.target.value) })} /></label>
            <label>Children<input style={field} type="number" value={rt.occupancy_children} onChange={e => setRt({ ...rt, occupancy_children: Number(e.target.value) })} /></label>
            <button type="submit">+ Add Room Type</button>
          </div>
        </form>
        <ul>
          {roomTypes.map((r: any) => <li key={r.id}>{r.name} (adults {r.occupancy_adults})</li>)}
        </ul>
      </section>

      <section>
        <h2>Room Rate Plans</h2>
        <form onSubmit={submitRatePlan} style={card}>
          <div style={row}>
            <label>Room Type
              <select value={rp.room_type_id} onChange={e => setRp({ ...rp, room_type_id: Number(e.target.value) })}>
                {roomTypes.map((r: any) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
              </select>
            </label>
            <label>Name<input style={field} type="text" value={rp.name} onChange={e => setRp({ ...rp, name: e.target.value })} placeholder="Standard Plan" /></label>
            <label>Refundable
              <select value={rp.refundable ? 'yes' : 'no'} onChange={e => setRp({ ...rp, refundable: e.target.value === 'yes' })}>
                <option value="yes">yes</option>
                <option value="no">no</option>
              </select>
            </label>
            <label>Pricing Mode
              <select value={rp.pricing_mode} onChange={e => setRp({ ...rp, pricing_mode: e.target.value })}>
                <option value="flat">flat</option>
                <option value="dynamic">dynamic</option>
              </select>
            </label>
            <button type="submit">+ Add Rate Plan</button>
          </div>
        </form>
        <ul>
          {ratePlans.map((p: any) => <li key={p.id}>#{p.id} · roomType {p.room_type_id} · {p.name} · {p.refundable ? 'refundable' : 'non‑refundable'} · {p.pricing_mode}</li>)}
        </ul>
      </section>

      <section>
        <h2>Services</h2>
        <form onSubmit={submitService} style={card}>
          <div style={row}>
            <label>Store ID<input style={field} type="number" value={svc.store_id} onChange={e => setSvc({ ...svc, store_id: Number(e.target.value) })} /></label>
            <label>Name<input style={field} type="text" value={svc.name} onChange={e => setSvc({ ...svc, name: e.target.value })} placeholder="AC Servicing" /></label>
            <label>Category<input style={field} type="text" value={svc.category} onChange={e => setSvc({ ...svc, category: e.target.value })} /></label>
            <label>Pricing
              <select value={svc.pricing_model} onChange={e => setSvc({ ...svc, pricing_model: e.target.value })}>
                <option value="dynamic">dynamic</option>
                <option value="fixed">fixed</option>
              </select>
            </label>
            <label>Base Price<input style={field} type="number" step="0.01" value={svc.base_price} onChange={e => setSvc({ ...svc, base_price: Number(e.target.value) })} /></label>
            <label>Transport/Visit Fee<input style={field} type="number" step="0.01" value={svc.visit_fee} onChange={e => setSvc({ ...svc, visit_fee: Number(e.target.value) })} /></label>
            <label>Duration (min)<input style={field} type="number" value={svc.duration_min} onChange={e => setSvc({ ...svc, duration_min: Number(e.target.value) })} placeholder="60" /></label>
            <label>Buffer Time (min)<input style={field} type="number" value={svc.buffer_time_min} onChange={e => setSvc({ ...svc, buffer_time_min: Number(e.target.value) })} placeholder="0 for no buffer" /></label>
            <label><input type="checkbox" checked={svc.at_customer_location} onChange={e => setSvc({ ...svc, at_customer_location: e.target.checked })} /> At customer location</label>
            <label>Status<input style={field} type="number" value={svc.status} onChange={e => setSvc({ ...svc, status: Number(e.target.value) })} /></label>
            <button type="submit">+ Add Service</button>
          </div>
        </form>
        <ul>
          {services.map((s: any) => <li key={s.id}>{s.name} — {s.category}</li>)}
        </ul>
      </section>

      <section>
        <h2>Service Slots</h2>
        <form onSubmit={submitSlot} style={card}>
          <div style={row}>
            <label>Store ID<input style={field} type="number" value={slot.store_id} onChange={e => setSlot({ ...slot, store_id: Number(e.target.value) })} /></label>
            <label>Date<input style={field} type="date" value={slot.date} onChange={e => setSlot({ ...slot, date: e.target.value })} /></label>
            <label>Start<input style={field} type="time" value={slot.start_time} onChange={e => setSlot({ ...slot, start_time: e.target.value })} /></label>
            <label>End<input style={field} type="time" value={slot.end_time} onChange={e => setSlot({ ...slot, end_time: e.target.value })} /></label>
            <label>Capacity<input style={field} type="number" value={slot.capacity} onChange={e => setSlot({ ...slot, capacity: Number(e.target.value) })} /></label>
            <button type="submit">+ Add Slot</button>
          </div>
        </form>
        <ul>
          {slotsList.map((s: any) => (
            <li key={s.id}>
              #{s.id} · store {s.store_id} · {s.date} {s.start_time}–{s.end_time} · cap {s.capacity} · booked {s.booked}
              <button style={{ marginLeft: 8 }} onClick={() => deleteSlot(s.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Movies</h2>
        <form onSubmit={addMovie} style={card}>
          <div style={row}>
            <label>Store ID<input style={field} type="number" value={mv.store_id} onChange={e => setMv({ ...mv, store_id: Number(e.target.value) })} /></label>
            <label>Title<input style={field} type="text" value={mv.title} onChange={e => setMv({ ...mv, title: e.target.value })} /></label>
            <label>Genre<input style={field} type="text" value={mv.genre} onChange={e => setMv({ ...mv, genre: e.target.value })} /></label>
            <label>Language<input style={field} type="text" value={mv.language} onChange={e => setMv({ ...mv, language: e.target.value })} placeholder="English" /></label>
            <label>Duration (min)<input style={field} type="number" value={mv.duration_min} onChange={e => setMv({ ...mv, duration_min: Number(e.target.value) })} /></label>
            <label>Buffer Time (min)<input style={field} type="number" value={mv.buffer_time_min} onChange={e => setMv({ ...mv, buffer_time_min: Number(e.target.value) })} placeholder="0 for no buffer" /></label>
            <button type="submit">+ Add Movie</button>
          </div>
        </form>
        <ul>{movies.map((m: any) => <li key={m.id}>{m.title} · {m.genre || '—'} · {m.duration_min}m</li>)}</ul>

        <form onSubmit={addScreen} style={card}>
          <div style={row}>
            <label>Store ID<input style={field} type="number" value={scr.store_id} onChange={e => setScr({ ...scr, store_id: Number(e.target.value) })} /></label>
            <label>Screen Name<input style={field} type="text" value={scr.name} onChange={e => setScr({ ...scr, name: e.target.value })} /></label>
            <label>Seat Count<input style={field} type="number" value={scr.seat_count} onChange={e => setScr({ ...scr, seat_count: Number(e.target.value) })} /></label>
            <button type="submit">+ Add Screen</button>
          </div>
        </form>
        <ul>{screens.map((s: any) => <li key={s.id}>#{s.id} · {s.name} · seats {s.seat_count}</li>)}</ul>

        <form onSubmit={addShowtime} style={card}>
          <div style={row}>
            <label>Store ID<input style={field} type="number" value={st.store_id} onChange={e => setSt({ ...st, store_id: Number(e.target.value) })} /></label>
            <label>Movie<select value={st.movie_id} onChange={e => setSt({ ...st, movie_id: Number(e.target.value) })}>{movies.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
            <label>Screen<select value={st.screen_id} onChange={e => setSt({ ...st, screen_id: Number(e.target.value) })}>{screens.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>Start<input style={field} type="datetime-local" value={st.starts_at} onChange={e => setSt({ ...st, starts_at: e.target.value })} /></label>
            <label>Base Price<input style={field} type="number" step="0.01" value={st.base_price} onChange={e => setSt({ ...st, base_price: Number(e.target.value) })} /></label>
            <button type="submit">+ Add Showtime</button>
          </div>
        </form>
        <ul>
          {showtimes.map((t: any) => (
            <li key={t.id}>
              #{t.id} · movie {t.movie_id} · screen {t.screen_id} · {new Date(t.starts_at).toLocaleString()} · ₹{t.base_price}
              <button style={{ marginLeft: 8 }} onClick={async () => { await fetch(`/movies/vendor/movies/showtimes/${t.id}`, { method: 'DELETE' }); setShowtimes(prev => prev.filter(x => x.id !== t.id)) }}>Delete</button>
            </li>
          ))}
        </ul>

        <h3>Screen Layout (JSON)</h3>
        <div style={card}>
          <div style={row}>
            <label>Screen
              <select value={layoutScreenId} onChange={e => setLayoutScreenId(Number(e.target.value))}>
                {screens.map((s: any) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
              </select>
            </label>
            <button onClick={async () => {
              const res = await fetch(`/movies/vendor/movies/screens/${layoutScreenId}/layout`).then(r => r.json()).catch(() => null)
              setLayoutJson(res ? JSON.stringify(res, null, 2) : '')
            }}>Load Layout</button>
          </div>
          <textarea style={{ width: '100%', minHeight: 120 }} value={layoutJson} onChange={e => setLayoutJson(e.target.value)} placeholder='{ "rows": [...] }' />
          <button onClick={async () => {
            if (!layoutJson.trim()) return
            const payload = JSON.parse(layoutJson)
            await postJSON(`/movies/vendor/movies/screens/${layoutScreenId}/layout`, payload)
          }}>Save Layout</button>
        </div>

        <h3>Showtime Pricing</h3>
        <form onSubmit={async (e) => { e.preventDefault(); await postJSON(`/movies/vendor/movies/showtimes/${showtimePricing.showtime_id}/pricing`, { sections: [{ section_id: showtimePricing.section_id, price_minor: Number(showtimePricing.price_minor) }] }); }} style={card}>
          <div style={row}>
            <label>Showtime<select value={showtimePricing.showtime_id} onChange={e => setShowtimePricing({ ...showtimePricing, showtime_id: Number(e.target.value) })}>{showtimes.map((t: any) => <option key={t.id} value={t.id}>#{t.id}</option>)}</select></label>
            <label>Section ID<input style={field} type="text" value={showtimePricing.section_id} onChange={e => setShowtimePricing({ ...showtimePricing, section_id: e.target.value })} /></label>
            <label>Price (minor)<input style={field} type="number" value={showtimePricing.price_minor} onChange={e => setShowtimePricing({ ...showtimePricing, price_minor: Number(e.target.value) })} /></label>
            <button type="submit">Set Pricing</button>
          </div>
        </form>
      </section>

      <section>
        <h2>Room Inventory</h2>
        <form onSubmit={submitInventory} style={card}>
          <div style={row}>
            <label>Room Type
              <select value={inv.room_type_id} onChange={e => setInv({ ...inv, room_type_id: Number(e.target.value) })}>
                {roomTypes.map((r: any) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
              </select>
            </label>
            <label>Date<input style={field} type="date" value={inv.date} onChange={e => setInv({ ...inv, date: e.target.value })} /></label>
            <label>Total Rooms<input style={field} type="number" value={inv.total_rooms} onChange={e => setInv({ ...inv, total_rooms: Number(e.target.value) })} /></label>
            <label>Price Override<input style={field} type="number" step="0.01" value={inv.price_override} onChange={e => setInv({ ...inv, price_override: e.target.value })} placeholder="optional" /></label>
            <button type="submit">+ Upsert Inventory</button>
          </div>
        </form>
        <ul>
          {inventory.map((i: any) => (
            <li key={i.id}>#{i.id} · roomType {i.room_type_id} · {i.date} · total {i.total_rooms} · sold {i.sold_rooms} · price {i.price_override ?? 'auto'} · {i.status}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Venues Management</h2>
        <form onSubmit={async (e) => { e.preventDefault(); const vn = { store_id: vendorStoreId, name: (document.getElementById('venue-name') as HTMLInputElement)?.value || '', venue_category: (document.getElementById('venue-cat') as HTMLSelectElement)?.value || 'cricket_turf', hourly_rate_minor: Number((document.getElementById('venue-rate') as HTMLInputElement)?.value || 200000), session_duration_min: Number((document.getElementById('venue-duration') as HTMLInputElement)?.value || 60), buffer_time_min: Number((document.getElementById('venue-buffer') as HTMLInputElement)?.value ?? 15), description: (document.getElementById('venue-desc') as HTMLTextAreaElement)?.value || '', facilities: (document.getElementById('venue-fac') as HTMLInputElement)?.value || '' }; const created = await postJSON('/venues/vendor/venues/catalog', vn); setVenues(p => [created, ...p]) }} style={card}>
          <div style={row}>
            <label>Name<input style={field} id="venue-name" type="text" placeholder="Cricket Turf" /></label>
            <label>Category
              <select id="venue-cat" style={field}>
                <option value="cricket_turf">Cricket Turf</option>
                <option value="badminton_court">Badminton Court</option>
                <option value="tennis_court">Tennis Court</option>
                <option value="football_turf">Football Ground</option>
              </select>
            </label>
            <label>Hourly Rate (₹)<input style={field} id="venue-rate" type="number" defaultValue="200" /></label>
            <label>Session Duration (min)<input style={field} id="venue-duration" type="number" defaultValue="60" placeholder="60" /></label>
            <label>Buffer Time (min)<input style={field} id="venue-buffer" type="number" defaultValue="15" placeholder="0 for no buffer" /></label>
            <label>Description<input style={field} id="venue-desc" type="text" placeholder="Professional cricket turf" /></label>
            <label>Facilities<input style={field} id="venue-fac" type="text" placeholder="Floodlights, Changing rooms" /></label>
            <button type="submit">+ Add Venue</button>
          </div>
        </form>
        <ul>{venues.map((v: any) => <li key={v.id}>#{v.id} · {v.name} · {v.venue_category} · ₹{Math.round(Number(v.hourly_rate_minor) / 100)}/hr</li>)}</ul>

        <h3>Venue Slots</h3>
        <form onSubmit={async (e) => { e.preventDefault(); const vs = { store_id: vendorStoreId, venue_type_id: Number((document.getElementById('vs-venue') as HTMLSelectElement)?.value || 1), date: (document.getElementById('vs-date') as HTMLInputElement)?.value || '', hour_start: Number((document.getElementById('vs-start') as HTMLInputElement)?.value || 0), hour_end: Number((document.getElementById('vs-end') as HTMLInputElement)?.value || 1), capacity: 1 }; await postJSON('/venues/vendor/venues/slots', vs); const refreshed = await fetch('/venues/vendor/venues/slots').then(r => r.json()).then(d => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : [])).catch(() => []); setVenueSlots(refreshed as any[]) }} style={card}>
          <div style={row}>
            <label>Venue<select id="vs-venue" style={field}>{venues.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
            <label>Date<input style={field} id="vs-date" type="date" /></label>
            <label>Start Hour<input style={field} id="vs-start" type="number" min="0" max="23" defaultValue="9" /></label>
            <label>End Hour<input style={field} id="vs-end" type="number" min="0" max="23" defaultValue="10" /></label>
            <button type="submit">+ Add Slot</button>
          </div>
        </form>
        <ul>
          {venueSlots.slice(0, 20).map((s: any) => (
            <li key={s.id}>
              #{s.id} · venue {s.venue_type_id} · {s.date} {s.hour_start}:00–{s.hour_end}:00 · booked {s.booked}
              <button style={{ marginLeft: 8 }} onClick={async () => { await fetch(`/venues/vendor/venues/slots/${s.id}`, { method: 'DELETE' }); setVenueSlots(prev => prev.filter(x => x.id !== s.id)) }}>Delete</button>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: '0.9em', color: '#666' }}>Showing first 20 slots (total: {venueSlots.length})</p>
      </section>

      <section>
        <h2>Vendor Bookings</h2>
        <div style={card}>
          <h3>Rooms</h3>
          {roomBookings.length === 0 ? <em>No room bookings</em> : (
            <ul>{roomBookings.map((b: any) => <li key={b.id}>#{b.id} · {b.status} · user {b.user_id} · {b.check_in}→{b.check_out}</li>)}</ul>
          )}

          <h3>Services</h3>
          {serviceAppointments.length === 0 ? <em>No appointments</em> : (
            <ul>{serviceAppointments.map((a: any) => <li key={a.id}>#{a.id} · {a.status} · user {a.user_id} · {new Date(a.scheduled_for || a.scheduledFor).toLocaleString()}</li>)}</ul>
          )}

          <h3>Movies</h3>
          {movieBookings.length === 0 ? <em>No movie bookings</em> : (
            <ul>{movieBookings.map((m: any) => <li key={m.id}>#{m.id} · {m.status} · showtime {m.showtime_id} · seats {m.seats}</li>)}</ul>
          )}

          <h3>Venues</h3>
          {venueBookings.length === 0 ? <em>No venue bookings</em> : (
            <ul>{venueBookings.map((v: any) => <li key={v.id}>#{v.id} · {v.status} · venue {v.venue_type_id} · slot {v.slot_id}</li>)}</ul>
          )}
        </div>
      </section>
    </div>
  )
}
