import { useEffect, useState } from 'react'

type Tab = 'rooms' | 'services' | 'movies' | 'venues'

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('rooms')
  const [rooms, setRooms] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [movies, setMovies] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Room booking state
  const [checkin, setCheckin] = useState('2026-05-01')
  const [checkout, setCheckout] = useState('2026-05-02')
  const [guests, setGuests] = useState(2)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [roomBooking, setRoomBooking] = useState<any>(null)

  // Service booking state
  const [selectedService, setSelectedService] = useState<any>(null)
  const [serviceDate, setServiceDate] = useState('2026-05-10')
  const [serviceSlots, setServiceSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [serviceBooking, setServiceBooking] = useState<any>(null)

  // Movie booking state
  const [selectedMovie, setSelectedMovie] = useState<any>(null)
  const [showtimes, setShowtimes] = useState<any[]>([])
  const [selectedShowtime, setSelectedShowtime] = useState<any>(null)
  const [seatLayout, setSeatLayout] = useState<any>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [movieBooking, setMovieBooking] = useState<any>(null)

  // Venue booking state
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [venueDate, setVenueDate] = useState('2026-05-15')
  const [venueSlots, setVenueSlots] = useState<any[]>([])
  const [selectedVenueSlot, setSelectedVenueSlot] = useState<any>(null)
  const [venueBooking, setVenueBooking] = useState<any>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [roomsRes, servicesRes, moviesRes, venuesRes] = await Promise.all([
        fetch(`/rooms/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}`).then(r => r.json()).catch(() => ({ items: [] })),
        fetch('/services/catalog').then(r => r.json()).catch(() => ({ items: [] })),
        fetch('/movies/catalog').then(r => r.json()).catch(() => ({ items: [] })),
        fetch('/venues/catalog').then(r => r.json()).catch(() => ({ items: [] }))
      ])
      setRooms(roomsRes.items || roomsRes || [])
      setServices(servicesRes.items || servicesRes || [])
      setMovies(moviesRes.items || moviesRes || [])
      setVenues(venuesRes.items || venuesRes || [])
    } catch (e) {
      console.error('Load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const searchRooms = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/rooms/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}`).then(r => r.json())
      setRooms(res.items || res || [])
    } finally {
      setLoading(false)
    }
  }

  const bookRoom = async () => {
    if (!selectedRoom) return
    try {
      const res = await fetch('/rooms/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 90001, storeId: parseInt(selectedRoom.store_id) || 1,
          checkIn: checkin, checkOut: checkout, rooms: 1, adults: guests, children: 0,
          items: [{ roomTypeId: selectedRoom.id, ratePlanId: 1, nights: 1, pricePerNightMinor: 10000, taxMinor: 500, totalMinor: 10500 }],
          payment: { mode: 'prepaid', walletMinor: 10500 }
        })
      }).then(r => r.json())
      setRoomBooking(res)
      alert(res.error || res.message || 'Booking request sent! (Check console for response)')
    } catch (e: any) {
      alert('Booking failed: ' + e.message)
    }
  }

  const loadServiceSlots = async (serviceId: number) => {
    try {
      // Use smart-slots endpoint with duration & buffer time
      const res = await fetch(`/services/smart-slots?service_id=${serviceId}&date=${serviceDate}&store_id=1`).then(r => r.json())
      setServiceSlots(res.available_slots || res.items || res || [])
    } catch (e) {
      console.error(e)
    }
  }

  const bookService = async () => {
    if (!selectedService || !selectedSlot) return
    try {
      // Construct proper ISO date from serviceDate (YYYY-MM-DD) and start_time (HH:MM)
      const scheduledFor = `${serviceDate}T${selectedSlot.start_time}:00.000Z`
      const res = await fetch('/services/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 90002, storeId: 1, serviceId: selectedService.id,
          pricing: {
            baseMinor: Math.round(parseFloat(selectedService.base_price || '100') * 100),
            visitFeeMinor: Math.round(parseFloat(selectedService.visit_fee || '0') * 100),
            taxMinor: 500
          },
          scheduledFor,
          payment: { mode: 'prepaid', walletMinor: 15000 }
        })
      }).then(r => r.json())
      setServiceBooking(res)
      alert(res.error || res.message || 'Service booking sent!')
    } catch (e: any) {
      alert('Booking failed: ' + e.message)
    }
  }

  const loadMovieShowtimes = async (movieId: number) => {
    try {
      const res = await fetch(`/movies/showtimes?movie_id=${movieId}`).then(r => r.json())
      setShowtimes(res.items || res || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadSeatLayout = async (showtimeId: number) => {
    try {
      const res = await fetch(`/movies/showtimes/${showtimeId}/layout`).then(r => r.json())
      setSeatLayout(res)
    } catch (e) {
      console.error(e)
    }
  }

  const toggleSeat = (seat: string) => {
    setSelectedSeats(prev =>
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    )
  }

  const bookMovie = async () => {
    if (!selectedShowtime || selectedSeats.length === 0) return
    try {
      const res = await fetch('/movies/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 90003, storeId: 1, showtimeId: selectedShowtime.id,
          seats: selectedSeats,
          pricing: { ticketMinor: 20000, taxMinor: 1000, totalMinor: 21000 },
          payment: { mode: 'prepaid', walletMinor: 21000 }
        })
      }).then(r => r.json())
      setMovieBooking(res)
      alert(res.error || res.message || 'Movie booking sent!')
    } catch (e: any) {
      alert('Booking failed: ' + e.message)
    }
  }

  const loadVenueSlots = async (venueId: number) => {
    try {
      // Use smart-slots endpoint with peak pricing
      const res = await fetch(`/venues/smart-slots?venue_type_id=${venueId}&date=${venueDate}&store_id=1`).then(r => r.json())
      setVenueSlots(res.available_slots || res.slots || res.items || res || [])
    } catch (e) {
      console.error(e)
    }
  }

  const bookVenue = async () => {
    if (!selectedVenue || !selectedVenueSlot) return
    try {
      // First, create the slot if it doesn't exist (smart-slots are virtual)
      const hourStart = parseInt(selectedVenueSlot.start_time.split(':')[0])
      const hourEnd = parseInt(selectedVenueSlot.end_time.split(':')[0])

      // Create slot via vendor API (using snake_case field names)
      const slotRes = await fetch('/venues/vendor/venues/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: 1,
          venue_type_id: selectedVenue.id,
          date: venueDate,
          hour_start: hourStart,
          hour_end: hourEnd,
          capacity: 1,
          status: 'open'
        })
      }).then(r => r.json()).catch(() => null)

      const slotId = slotRes?.id || 480 // fallback to test slot

      // Now book the venue
      const res = await fetch('/venues/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 90004,
          storeId: 1,
          venueTypeId: selectedVenue.id,
          slotId: slotId,
          date: venueDate,
          hours: hourEnd - hourStart,
          pricing: { baseMinor: Math.round(selectedVenueSlot.price * 100), taxMinor: 2500 },
          amountMinor: Math.round(selectedVenueSlot.price * 100) + 2500,
          payment: { mode: 'prepaid', walletMinor: Math.round(selectedVenueSlot.price * 100) + 2500 }
        })
      }).then(r => r.json())
      setVenueBooking(res)
      alert(res.error || res.message || `Venue booking sent! Booking ID: ${res.bookingId}`)
    } catch (e: any) {
      alert('Booking failed: ' + e.message)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Loading...</h1>
      </div>
    )
  }

  const styles = {
    container: { fontFamily: 'system-ui', padding: '20px', maxWidth: '1200px', margin: '0 auto', background: '#f5f5f5', minHeight: '100vh' },
    header: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '30px', borderRadius: '8px', marginBottom: '20px' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' as const },
    tab: { padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' } as React.CSSProperties,
    section: { background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' },
    card: { border: '1px solid #e0e0e0', padding: '15px', borderRadius: '6px', background: '#f9f9f9', marginBottom: '15px' },
    button: { background: '#667eea', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginRight: '10px' } as React.CSSProperties,
    input: { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginRight: '10px', fontSize: '14px' } as React.CSSProperties,
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
    seat: { width: '40px', height: '40px', margin: '4px', border: '2px solid #ddd', borderRadius: '4px', cursor: 'pointer', display: 'inline-block', textAlign: 'center' as const, lineHeight: '36px', fontSize: '12px' },
    selected: { background: '#667eea', color: 'white', borderColor: '#667eea' },
    booked: { background: '#e0e0e0', cursor: 'not-allowed' }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>Mangwale — User Portal</h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>Complete booking system with rooms, services, movies, and venues</p>
      </header>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, background: activeTab === 'rooms' ? '#667eea' : '#e0e0e0', color: activeTab === 'rooms' ? 'white' : '#333' }}
          onClick={() => setActiveTab('rooms')}
        >
          🏨 Rooms
        </button>
        <button
          style={{ ...styles.tab, background: activeTab === 'services' ? '#667eea' : '#e0e0e0', color: activeTab === 'services' ? 'white' : '#333' }}
          onClick={() => setActiveTab('services')}
        >
          🛠️ Services
        </button>
        <button
          style={{ ...styles.tab, background: activeTab === 'movies' ? '#667eea' : '#e0e0e0', color: activeTab === 'movies' ? 'white' : '#333' }}
          onClick={() => setActiveTab('movies')}
        >
          🎬 Movies
        </button>
        <button
          style={{ ...styles.tab, background: activeTab === 'venues' ? '#667eea' : '#e0e0e0', color: activeTab === 'venues' ? 'white' : '#333' }}
          onClick={() => setActiveTab('venues')}
        >
          🏛️ Venues
        </button>
      </div>

      {activeTab === 'rooms' && (
        <div>
          <div style={styles.section}>
            <h2>🏨 Room Booking</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Search available rooms by date and guest count</p>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label>
                Check-in: <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} style={styles.input} />
              </label>
              <label>
                Check-out: <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} style={styles.input} />
              </label>
              <label>
                Guests: <input type="number" min={1} value={guests} onChange={e => setGuests(Number(e.target.value))} style={{ ...styles.input, width: '80px' }} />
              </label>
              <button onClick={searchRooms} style={styles.button}>Search Rooms</button>
            </div>

            <div style={styles.grid}>
              {rooms.map((room: any) => (
                <div key={room.id} style={styles.card}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{room.name}</h3>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>👥 {room.occupancy_adults} adults, {room.occupancy_children} children</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>🏪 Store: {room.store_id}</p>
                  <button
                    onClick={() => setSelectedRoom(room)}
                    style={{ ...styles.button, marginTop: '10px', background: selectedRoom?.id === room.id ? '#764ba2' : '#667eea' }}
                  >
                    {selectedRoom?.id === room.id ? '✓ Selected' : 'Select Room'}
                  </button>
                </div>
              ))}
            </div>

            {selectedRoom && (
              <div style={{ ...styles.section, marginTop: '20px', background: '#e3f2fd' }}>
                <h3>Complete Your Booking</h3>
                <p><strong>Room:</strong> {selectedRoom.name}</p>
                <p><strong>Dates:</strong> {checkin} to {checkout}</p>
                <p><strong>Guests:</strong> {guests}</p>
                <p><strong>Estimated Price:</strong> ₹105 (base ₹100 + tax ₹5)</p>
                <button onClick={bookRoom} style={styles.button}>Confirm Booking</button>
                <button onClick={() => setSelectedRoom(null)} style={{ ...styles.button, background: '#999' }}>Cancel</button>
                {roomBooking && <pre style={{ marginTop: '15px', padding: '10px', background: '#fff', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }}>{JSON.stringify(roomBooking, null, 2)}</pre>}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div>
          <div style={styles.section}>
            <h2>🛠️ Service Booking</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Book professional services like AC repair, plumbing, etc.</p>

            <div style={styles.grid}>
              {services.map((service: any) => (
                <div key={service.id} style={styles.card}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{service.name}</h3>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>📁 {service.category || 'General'}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>💰 Base Price: ₹{parseFloat(service.base_price || '0').toFixed(2)}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>💵 Pricing: {service.pricing_model}</p>
                  <button
                    onClick={() => { setSelectedService(service); loadServiceSlots(service.id) }}
                    style={{ ...styles.button, marginTop: '10px', background: selectedService?.id === service.id ? '#764ba2' : '#667eea' }}
                  >
                    {selectedService?.id === service.id ? '✓ Selected' : 'Select Service'}
                  </button>
                </div>
              ))}
            </div>

            {selectedService && (
              <div style={{ ...styles.section, marginTop: '20px', background: '#fff3e0' }}>
                <h3>Book {selectedService.name}</h3>
                <label>
                  Service Date: <input type="date" value={serviceDate} onChange={e => { setServiceDate(e.target.value); loadServiceSlots(selectedService.id) }} style={styles.input} />
                </label>

                {serviceSlots.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Available Slots (with buffer time):</strong></p>
                    {serviceSlots.map((slot: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlot(slot)}
                        style={{ ...styles.button, background: selectedSlot?.start_time === slot.start_time ? '#764ba2' : '#667eea', marginBottom: '5px' }}
                      >
                        ⏰ {slot.start_time} - {slot.end_time} ({slot.duration_min}min + {slot.buffer_min}min buffer)
                      </button>
                    ))}
                  </div>
                )}

                {selectedSlot && (
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Slot:</strong> {selectedSlot.start_time} - {selectedSlot.end_time}</p>
                    <button onClick={bookService} style={styles.button}>Confirm Service Booking</button>
                  </div>
                )}

                <button onClick={() => { setSelectedService(null); setServiceSlots([]); setSelectedSlot(null) }} style={{ ...styles.button, background: '#999', marginTop: '10px' }}>Cancel</button>
                {serviceBooking && <pre style={{ marginTop: '15px', padding: '10px', background: '#fff', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }}>{JSON.stringify(serviceBooking, null, 2)}</pre>}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'movies' && (
        <div>
          <div style={styles.section}>
            <h2>🎬 Movie Ticket Booking</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Book movie tickets with seat selection</p>

            <div style={styles.grid}>
              {movies.map((movie: any) => (
                <div key={movie.id} style={styles.card}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{movie.title}</h3>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>⏱️ Duration: {movie.duration_minutes || 'N/A'} min</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>🗣️ Language: {movie.language || 'N/A'}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>🎭 Genre: {movie.genre || 'N/A'}</p>
                  <button
                    onClick={() => { setSelectedMovie(movie); loadMovieShowtimes(movie.id) }}
                    style={{ ...styles.button, marginTop: '10px', background: selectedMovie?.id === movie.id ? '#764ba2' : '#667eea' }}
                  >
                    {selectedMovie?.id === movie.id ? '✓ Selected' : 'Book Tickets'}
                  </button>
                </div>
              ))}
            </div>

            {selectedMovie && showtimes.length > 0 && (
              <div style={{ ...styles.section, marginTop: '20px', background: '#fce4ec' }}>
                <h3>Select Showtime for {selectedMovie.title}</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {showtimes.map((showtime: any) => (
                    <button
                      key={showtime.id}
                      onClick={() => { setSelectedShowtime(showtime); loadSeatLayout(showtime.id) }}
                      style={{ ...styles.button, background: selectedShowtime?.id === showtime.id ? '#764ba2' : '#667eea' }}
                    >
                      {new Date(showtime.start_time).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedShowtime && seatLayout && (
              <div style={{ ...styles.section, marginTop: '20px', background: '#e8f5e9' }}>
                <h3>Select Your Seats</h3>
                <div style={{ textAlign: 'center', marginBottom: '20px', padding: '10px', background: '#333', color: 'white', borderRadius: '4px' }}>🎬 SCREEN</div>
                {seatLayout.rows && Object.entries(seatLayout.rows).map(([row, seats]: [string, any]) => (
                  <div key={row} style={{ marginBottom: '8px' }}>
                    <span style={{ display: 'inline-block', width: '30px', fontWeight: 'bold' }}>{row}</span>
                    {seats.map((seat: any) => (
                      <span
                        key={seat.number}
                        onClick={() => seat.status === 'available' && toggleSeat(seat.number)}
                        style={{
                          ...styles.seat,
                          ...(selectedSeats.includes(seat.number) ? styles.selected : {}),
                          ...(seat.status !== 'available' ? styles.booked : {})
                        }}
                      >
                        {seat.number.replace(row, '')}
                      </span>
                    ))}
                  </div>
                ))}

                <div style={{ marginTop: '20px' }}>
                  <p><strong>Selected Seats:</strong> {selectedSeats.join(', ') || 'None'}</p>
                  <p><strong>Price:</strong> ₹{selectedSeats.length * 200} ({selectedSeats.length} tickets × ₹200)</p>
                  <button onClick={bookMovie} disabled={selectedSeats.length === 0} style={{ ...styles.button, opacity: selectedSeats.length === 0 ? 0.5 : 1 }}>Confirm Booking</button>
                  <button onClick={() => { setSelectedMovie(null); setShowtimes([]); setSelectedShowtime(null); setSeatLayout(null); setSelectedSeats([]) }} style={{ ...styles.button, background: '#999' }}>Cancel</button>
                </div>

                {movieBooking && <pre style={{ marginTop: '15px', padding: '10px', background: '#fff', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }}>{JSON.stringify(movieBooking, null, 2)}</pre>}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'venues' && (
        <div>
          <div style={styles.section}>
            <h2>🏛️ Venue Booking</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Book venues for events, meetings, and gatherings</p>

            <div style={styles.grid}>
              {venues.map((venue: any) => (
                <div key={venue.id} style={styles.card}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{venue.name}</h3>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>👥 Capacity: {venue.capacity || 'N/A'}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>📍 Location: {venue.location || 'N/A'}</p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>🏪 Store: {venue.store_id}</p>
                  <button
                    onClick={() => { setSelectedVenue(venue); loadVenueSlots(venue.id) }}
                    style={{ ...styles.button, marginTop: '10px', background: selectedVenue?.id === venue.id ? '#764ba2' : '#667eea' }}
                  >
                    {selectedVenue?.id === venue.id ? '✓ Selected' : 'Book Venue'}
                  </button>
                </div>
              ))}
            </div>

            {selectedVenue && (
              <div style={{ ...styles.section, marginTop: '20px', background: '#f3e5f5' }}>
                <h3>Book {selectedVenue.name}</h3>
                <label>
                  Event Date: <input type="date" value={venueDate} onChange={e => { setVenueDate(e.target.value); loadVenueSlots(selectedVenue.id) }} style={styles.input} />
                </label>

                {venueSlots.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Available Time Slots (with peak pricing):</strong></p>
                    {venueSlots.map((slot: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVenueSlot(slot)}
                        style={{ ...styles.button, background: selectedVenueSlot?.start_time === slot.start_time ? '#764ba2' : '#667eea', marginBottom: '5px', marginRight: '5px' }}
                      >
                        ⏰ {slot.start_time} - {slot.end_time} | 💰 ₹{slot.price} {slot.price > (selectedVenue.base_price || 800) ? '🔥' : ''}
                      </button>
                    ))}
                  </div>
                )}

                {selectedVenueSlot && (
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Time:</strong> {selectedVenueSlot.start_time} - {selectedVenueSlot.end_time} ({selectedVenueSlot.duration_min}min + {selectedVenueSlot.buffer_min}min buffer)</p>
                    <p><strong>Price:</strong> ₹{selectedVenueSlot.price} {selectedVenueSlot.price > (selectedVenue.base_price || 800) ? '(Peak Hour 🔥)' : '(Off-Peak)'}</p>
                    <button onClick={bookVenue} style={styles.button}>Confirm Venue Booking</button>
                  </div>
                )}

                <button onClick={() => { setSelectedVenue(null); setVenueSlots([]); setSelectedVenueSlot(null) }} style={{ ...styles.button, background: '#999', marginTop: '10px' }}>Cancel</button>
                {venueBooking && <pre style={{ marginTop: '15px', padding: '10px', background: '#fff', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }}>{JSON.stringify(venueBooking, null, 2)}</pre>}
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '14px' }}>
        <p>🧪 Demo System • {rooms.length} rooms • {services.length} services • {movies.length} movies • {venues.length} venues</p>
        <p style={{ fontSize: '12px', marginTop: '5px' }}>Features: Date selection • Slot booking • Seat selection • Real-time availability • Payment integration</p>
      </footer>
    </div>
  )
}
