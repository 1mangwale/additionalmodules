# 🧪 COMPREHENSIVE TESTING INSTRUCTIONS

**Status**: ✅ System Ready for Testing  
**Last Updated**: January 2025

---

## 🚀 QUICK START (2 Minutes)

### Option 1: Automated Full Test
```bash
cd /home/ubuntu/projects/additional-modules
./run-comprehensive-tests.sh
```

### Option 2: Browse User Portal
```
http://localhost:5183
```

### Option 3: Browse Vendor Admin
```
http://localhost:5184
```

---

## 🧪 COMPREHENSIVE TESTING GUIDE

### Phase 1: Infrastructure Verification

#### Step 1a: Verify All Services Are Running
```bash
# Check all health endpoints
for port in 4000 4001 4002 4004 4005 4007; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq .
done
```

#### Step 1b: Verify Frontends Are Accessible
```bash
# Check frontend availability
curl -s http://localhost:5183/ | head -c 200
curl -s http://localhost:5184/ | head -c 200
```

#### Step 1c: Verify Database Connection
```bash
# Connect to database
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking \
  -c "SELECT version();"
```

### Phase 2: Data Verification

#### Step 2a: Check Movies Module Data
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking << 'SQL'
SELECT COUNT(*) as total_movies FROM movies;
SELECT COUNT(*) as total_showtimes FROM showtimes WHERE DATE(starts_at) >= '2026-02-01';
SELECT COUNT(*) as total_screens FROM screens;
SQL
```

#### Step 2b: Check Rooms Module Data
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking << 'SQL'
SELECT COUNT(*) as room_types FROM room_types;
SELECT COUNT(*) as inventory_records FROM room_inventory WHERE date >= '2026-02-01';
SELECT COUNT(*) as existing_bookings FROM room_bookings;
SQL
```

#### Step 2c: Check Services Module Data
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking << 'SQL'
SELECT COUNT(*) as services FROM services_catalog;
SELECT COUNT(*) as slots FROM service_slots WHERE date >= '2026-02-01';
SELECT COUNT(*) as appointments FROM service_appointments;
SQL
```

#### Step 2d: Check Venues Module Data
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking << 'SQL'
SELECT COUNT(*) as venue_types FROM venue_types;
SELECT COUNT(*) as venue_slots FROM venue_slots;
SELECT COUNT(*) as bookings FROM venue_bookings;
SQL
```

### Phase 3: API Endpoint Testing

#### Step 3a: Test Read Endpoints (All Should Return 200 OK)
```bash
echo "=== ROOMS ==="
curl -s http://localhost:4001/rooms/search | jq '.items | length'

echo "=== SERVICES ==="
curl -s http://localhost:4002/services/catalog | jq '.data | length'

echo "=== MOVIES ==="
curl -s http://localhost:4005/movies/catalog | jq '.data | length'

echo "=== VENUES ==="
curl -s http://localhost:4007/venues/catalog | jq '.data | length'
```

#### Step 3b: Test Pricing Calculation
```bash
echo "=== ROOMS PRICE CALCULATION ==="
curl -s -X POST http://localhost:4001/rooms/price \
  -H "Content-Type: application/json" \
  -d '{
    "roomTypeId": 1,
    "checkIn": "2026-02-01",
    "checkOut": "2026-02-03"
  }' | jq .
```

#### Step 3c: Test Booking Endpoints
```bash
echo "=== ROOM BOOKING TEST ==="
curl -s -X POST http://localhost:4001/rooms/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "roomTypeId": 1,
    "checkIn": "2026-02-01",
    "checkOut": "2026-02-03",
    "guests": 2
  }' | jq .

echo "=== SERVICE BOOKING TEST ==="
curl -s -X POST http://localhost:4002/services/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "serviceId": 1,
    "date": "2026-02-02",
    "time": "09:00"
  }' | jq .

echo "=== MOVIE BOOKING TEST ==="
curl -s -X POST http://localhost:4005/movies/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "showtimeId": 1,
    "seatIds": [1, 2, 3]
  }' | jq .

echo "=== VENUE BOOKING TEST ==="
curl -s -X POST http://localhost:4007/venues/book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "venueId": 1,
    "date": "2026-02-02",
    "startTime": "10:00",
    "endTime": "14:00",
    "guestCount": 50
  }' | jq .
```

### Phase 4: Frontend Testing

#### Step 4a: User Portal Testing (http://localhost:5183)
1. **Browse Movies**
   - Navigate to Movies section
   - See 7 movies listed
   - Click on a movie to see details
   - View available showtimes

2. **Browse Rooms**
   - Navigate to Rooms section
   - See 2 room types
   - Select check-in/check-out dates
   - View available rooms

3. **Browse Services**
   - Navigate to Services section
   - See 3 services available
   - Select date and time
   - View available slots

4. **Browse Venues**
   - Navigate to Venues section
   - See 4 venue types
   - Select date and time range
   - View available venues

5. **Booking History**
   - Click on "Booking History" or similar
   - View all past/current bookings
   - See booking details

#### Step 4b: Vendor Admin Testing (http://localhost:5184)
1. **Create Room**
   - Go to Rooms management
   - Click "Add Room"
   - Fill in details
   - Click "Save"

2. **Create Service**
   - Go to Services management
   - Click "Add Service"
   - Fill in details
   - Click "Save"

3. **Create Movie**
   - Go to Movies management
   - Click "Add Movie"
   - Fill in details
   - Click "Save"

4. **Create Venue**
   - Go to Venues management
   - Click "Add Venue"
   - Fill in details
   - Click "Save"

5. **Manage Inventory**
   - Go to Inventory section
   - Update available slots
   - Set prices
   - Save changes

### Phase 5: Integration Testing

#### Step 5a: End-to-End Booking Flow (User Portal)
1. Open http://localhost:5183
2. Browse a module (e.g., Movies)
3. Select an item (e.g., movie)
4. Choose date/time/slots
5. Click "Book"
6. Confirm booking
7. Check "Booking History" to verify

#### Step 5b: Vendor Operations Flow
1. Open http://localhost:5184
2. Create a new resource
3. Set up inventory/slots
4. Verify it appears in user portal
5. Delete the resource (if supported)
6. Verify removal in user portal

---

## 🔧 TROUBLESHOOTING

### Services Not Responding
```bash
# Check if containers are running
docker ps | grep -E 'rooms|services|movies|venues|gateway|finance'

# Check service logs
docker logs rooms-service
docker logs services-service
docker logs movies-service
docker logs venues-service
```

### Database Connection Failed
```bash
# Test database connectivity
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -c "SELECT 1;"

# Check if database is running
docker ps | grep postgres
```

### Frontend Not Accessible
```bash
# Check if frontend containers are running
docker ps | grep web

# Check frontend logs
docker logs web-user
docker logs web-vendor
```

### API Returns 500 Error
```bash
# Check service logs for error details
docker logs rooms-service | tail -50

# Verify request format matches DTO
# Check if required fields are present in request body
```

---

## 📊 EXPECTED TEST RESULTS

### All Services Should Show
```
✓ Service on port 4000 - OK
✓ Service on port 4001 - OK
✓ Service on port 4002 - OK
✓ Service on port 4004 - OK
✓ Service on port 4005 - OK
✓ Service on port 4007 - OK
```

### All Frontends Should Be Accessible
```
✓ Frontend on port 5183 - Accessible
✓ Frontend on port 5184 - Accessible
```

### All Read Endpoints Should Return 200
```
✓ GET Rooms Search - 200 OK
✓ GET Services Catalog - 200 OK
✓ GET Movies Catalog - 200 OK
✓ GET Venues Catalog - 200 OK
```

### Database Should Have Test Data
```
✓ Movies: 7
✓ Room Types: 2
✓ Services: 3
✓ Venues: 4
✓ Venue Slots: 476
```

---

## 📝 TESTING CHECKLIST

### Pre-Testing Verification
- [ ] All 6 services running (health check)
- [ ] Both frontends accessible
- [ ] Database connected
- [ ] Test data verified (query results)

### API Testing
- [ ] GET /rooms/search returns 200
- [ ] GET /services/catalog returns 200
- [ ] GET /movies/catalog returns 200
- [ ] GET /venues/catalog returns 200
- [ ] POST /rooms/price returns 201
- [ ] POST /rooms/book tested
- [ ] POST /services/book tested
- [ ] POST /movies/book tested
- [ ] POST /venues/book tested

### Frontend Testing
- [ ] User portal loads
- [ ] Can browse all 4 modules
- [ ] Can view booking history
- [ ] Can make bookings (UI)

### Vendor Testing
- [ ] Vendor admin loads
- [ ] Can create resources
- [ ] Can manage inventory
- [ ] Can view bookings

### Integration Testing
- [ ] End-to-end booking flow works
- [ ] Data persists in database
- [ ] Booking history updates
- [ ] New resources appear in user portal

---

## 🎯 SUCCESS CRITERIA

✅ **System is READY if:**
1. All 6 services responding to health checks
2. Both frontends accessible
3. All GET endpoints returning data
4. Database contains all test data
5. Test data has future dates (2026+)
6. No critical errors in logs

✅ **Booking is WORKING if:**
1. Booking endpoints accepting requests
2. Database recording bookings
3. Booking history showing created bookings
4. Inventory/slots decreasing after booking

---

## 📞 SUPPORT

### Common Issues & Solutions

**Issue**: Service port already in use
**Solution**: Kill existing process or change port in docker-compose

**Issue**: Database connection refused  
**Solution**: Ensure PostgreSQL container is running and healthy

**Issue**: Frontend shows blank page
**Solution**: Check browser console for errors, check nginx logs

**Issue**: Booking returns 500 error
**Solution**: Check if userId exists, verify request DTO format

---

## ✨ Next Steps After Testing

1. **Document Results**: Record all test outcomes
2. **Fix Issues**: Address any failing tests
3. **Performance Test**: Load test with multiple concurrent bookings
4. **Security Test**: Test input validation and authentication
5. **Production Deploy**: Deploy to production environment

---

*Generated: January 2025*  
*System: Complete 4-Module Booking Platform*  
*Status: ✅ Ready for Testing*
