# Quick Reference - System Status & How to Test
**Last Updated**: 2026-01-31

---

## 🚀 QUICK START

### Running the System

```bash
# Terminal 1: Start all backend services (from root)
cd /home/ubuntu/projects/additional-modules
pnpm dev

# Terminal 2: Start user portal frontend
cd apps/web-user
pnpm dev

# Terminal 3: Start vendor portal frontend  
cd apps/web-vendor
pnpm dev

# Database: Already running in Docker
docker ps | grep postgres
```

### Access Points

- **User Portal**: http://localhost:5183/user/
- **Vendor Admin**: http://localhost:5184/vendor/
- **Rooms API**: http://localhost:4001
- **Services API**: http://localhost:4002
- **Movies API**: http://localhost:4005
- **Venues API**: http://localhost:4007

---

## ✅ WHAT'S WORKING NOW

### User Portal - 4 Complete Modules

1. **🏨 Rooms**
   - Search by date & guests
   - Browse available rooms
   - Book instantly
   - See booking confirmation

2. **🔧 Services**
   - Browse 3 services (Plumber, Electrician, Cleaning)
   - Pick date and see available slots
   - Book appointment
   - Get confirmation

3. **🎬 Movies**
   - Browse 7 movies (FIXED: was 2 duplicates)
   - See showtimes for each movie
   - Book tickets
   - Get confirmation

4. **🏟️ Venues** (NEW!)
   - Browse 4 venue types (Cricket, Badminton, Tennis, Football)
   - Search available slots by date
   - Book 1-hour slots
   - See confirmation

5. **📋 Booking History** (NEW!)
   - Click "Show My Bookings"
   - See all your bookings
   - View booking details

### Vendor Admin - Full CRUD

1. **🏨 Rooms**
   - Create room types ✅
   - Manage inventory ✅
   - Set rate plans ✅

2. **🔧 Services**
   - Create services ✅
   - Create/delete slots ✅
   - Manage pricing ✅

3. **🎬 Movies**
   - Create movies ✅
   - Create screens ✅
   - Create/delete showtimes ✅

4. **🏟️ Venues** (NEW!)
   - Create venue types ✅
   - Create/delete venue slots ✅
   - Manage availability ✅

---

## 🧪 QUICK TESTS

### Test 1: Room Booking (2 min)
```
1. Open http://localhost:5183/user/
2. Scroll to "Available Rooms"
3. Click "Search"
4. Click "View" on a room
5. Click "Book this room"
6. See JSON response with booking ID
```

### Test 2: Venue Booking (2 min)
```
1. Open http://localhost:5183/user/
2. Scroll to "Sports Venues"
3. Click "View" on any venue (e.g., Cricket Turf)
4. Pick date "2026-02-02"
5. Click "Load slots"
6. Click "Book this slot"
7. See booking confirmation
```

### Test 3: Service Booking (2 min)
```
1. Open http://localhost:5183/user/
2. Scroll to "Services"
3. Click "View" on Plumber
4. Pick date "2026-02-01"
5. Click "Load slots"
6. Click "Book this slot"
7. See confirmation with appointment ID
```

### Test 4: Movie Booking (2 min)
```
1. Open http://localhost:5183/user/
2. Scroll to "Movies"
3. See 7 different movies (not duplicate Avengers)
4. Click "Showtimes" on any movie
5. See 1-2 showtimes with prices
```

### Test 5: Vendor Creates Service (2 min)
```
1. Open http://localhost:5184/vendor/
2. Scroll to "Services"
3. Fill form: Name="Test Service", Category="electrical", Price="1000"
4. Click "+ Add Service"
5. See new service in list
```

### Test 6: Vendor Creates Venue (2 min)
```
1. Open http://localhost:5184/vendor/
2. Scroll to "Venues Management"
3. Fill: Name="Test Court", Category="tennis_court", Rate="5000"
4. Click "+ Add Venue"
5. See new venue in list
```

---

## 📊 CURRENT DATA

### Movies (7 total, was 2)
- Avengers: Endgame (Action, 180m)
- The Dark Knight Rises (Action, 164m)
- Inception (Sci-Fi, 148m)
- The Shawshank Redemption (Drama, 142m)
- Pulp Fiction (Crime, 154m)
- Interstellar (Sci-Fi, 169m)
- [One more from initial seed]

### Services (3 total)
- Plumber (₹500 + ₹100 transport)
- Electrician (₹600 + ₹150 transport)
- House Cleaning (₹800)

### Venues (4 total)
- Cricket Turf - Premium (₹200/hr)
- Badminton Court A (₹80/hr)
- Tennis Court (₹150/hr)
- Football Ground (₹300/hr)

### Rooms (2 total)
- Deluxe Suite (2 adults, 0 children)
- Premium Suite (3 adults, 2 children)

---

## 🐛 KNOWN ISSUES (Not Critical)

| Issue | Workaround | Priority |
|-------|-----------|----------|
| No authentication | Use hardcoded userId: 1 | Low (deferred) |
| Payment mock only | Use mode: 'prepaid' | Low (deferred) |
| No seat selection UI | Book without selecting seats | Low (deferred) |
| Basic styling | Works functionally fine | Low (nice-to-have) |
| No mobile layout | Works on desktop | Low (nice-to-have) |

---

## 📡 API HEALTH CHECK

```bash
# Quick health check of all services
curl http://localhost:4000/health && echo "✓ Gateway"
curl http://localhost:4001/rooms/health && echo "✓ Rooms"
curl http://localhost:4002/services/health && echo "✓ Services"
curl http://localhost:4004/health && echo "✓ Finance"
curl http://localhost:4005/movies/health && echo "✓ Movies"
curl http://localhost:4007/venues/health && echo "✓ Venues"
```

---

## 📝 FILES TO REVIEW

### New Documentation
- **COMPREHENSIVE-GAP-ANALYSIS.md** - Detailed gap analysis with all issues
- **COMPLETE-TESTING-GUIDE-UPDATED.md** - Step-by-step test scenarios
- **FINAL-SYSTEM-SUMMARY.md** - Executive summary & architecture
- **QUICK-REFERENCE.md** - This file!

### Modified Code
- **apps/web-user/src/ui/App.tsx** - Added venues + booking history
- **apps/web-vendor/src/ui/App.tsx** - Added venue management

---

## ⚡ COMMON ISSUES & FIXES

### Frontend not loading
```bash
# Kill old process and restart
lsof -i :5183  # Find web-user process
kill -9 <PID>
cd apps/web-user && pnpm dev
```

### Backend service not responding
```bash
# Check if running
lsof -i :4007  # For venues example
# Or check logs
ps aux | grep venues
```

### Database connection error
```bash
# Check database is running
docker ps | grep postgres
# Verify credentials in .env
cat .env | grep PG_
```

### Database port conflict
```bash
# Reset database
docker-compose down
docker-compose up -d
```

---

## 🎯 NEXT STEPS (Optional)

### If You Want to Add Features

1. **Professional Styling**
   - Install Tailwind: `npm install -D tailwindcss`
   - Create styles.css with color scheme
   - Apply to components

2. **Authentication**
   - Add JWT token library
   - Create login page
   - Add auth guard to routes

3. **Better UX**
   - Add React Router for pages
   - Break into separate components
   - Add loading spinners
   - Add error notifications

4. **Real Payments**
   - Remove FINANCE_MOCK=true
   - Integrate Stripe/Razorpay
   - Add payment form

---

## 📞 SUPPORT

**If something doesn't work:**

1. Check backend is running:
   ```bash
   curl http://localhost:4000/health
   ```

2. Check database connection:
   ```bash
   PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -c "SELECT 1"
   ```

3. Check frontend is running:
   ```bash
   curl http://localhost:5183/user/
   ```

4. Clear browser cache:
   - Chrome: Ctrl+Shift+Del
   - Or open in Incognito/Private mode

---

## 🎓 TECHNICAL DETAILS

### Stack
- **Backend**: NestJS 10 + TypeORM 0.3 + PostgreSQL
- **Frontend**: React 18 + Vite
- **Deployment**: Docker + docker-compose
- **Infrastructure**: 6 microservices + 1 database

### Port Assignment
```
4000 = Gateway
4001 = Rooms API
4002 = Services API
4004 = Finance API
4005 = Movies API
4007 = Venues API
5183 = Web-User frontend
5184 = Web-Vendor frontend
5432 = PostgreSQL database
```

### Important Directories
```
/apps/
  ├── rooms/              → Room module (API)
  ├── services-api/       → Services module (API)
  ├── movies/             → Movies module (API)
  ├── venues/             → Venues module (API)
  ├── gateway/            → Gateway (reverse proxy)
  ├── bridge-finance/     → Payment gateway
  ├── web-user/           → User portal (React)
  └── web-vendor/         → Vendor admin (React)

/db/
  └── pg/                 → Database SQL schema

/deploy/
  └── pm2/                → Production config
```

---

## ✅ VERIFICATION CHECKLIST

Use this before declaring "ready":

- [ ] User Portal accessible at 5183
- [ ] Vendor Portal accessible at 5184
- [ ] Can view rooms and book
- [ ] Can view services and book
- [ ] Can view movies (7 total, diverse)
- [ ] Can view venues (4 total)
- [ ] Can create service in vendor
- [ ] Can create venue in vendor
- [ ] Database shows new records when booking
- [ ] All health endpoints return 200

---

**System Status**: ✅ **FULLY FUNCTIONAL**

Ready for demonstration and testing!

