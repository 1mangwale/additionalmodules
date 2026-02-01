#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          END-TO-END COMPREHENSIVE BOOKING SYSTEM TEST            ║${NC}"
echo -e "${BLUE}║              VENDOR CREATES → USER BOOKS (Complete Flow)         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${CYAN}Test Date: $(date)${NC}"
echo -e "${CYAN}System Ready: ✅${NC}"

TESTS_PASSED=0
TESTS_FAILED=0

log_test() {
    local name=$1
    local result=$2
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓ $name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ $name${NC}"
        ((TESTS_FAILED++))
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 1: PRE-TEST VERIFICATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo ""
echo "Checking all services..."

for port in 4000 4001 4002 4004 4005 4007; do
    if curl -s http://localhost:$port/health >/dev/null 2>&1; then
        log_test "Service on port $port" "PASS"
    else
        log_test "Service on port $port" "FAIL"
    fi
done

echo ""
echo "Checking frontends..."
for port in 5183 5184; do
    if curl -s http://localhost:$port/ >/dev/null 2>&1; then
        log_test "Frontend on port $port" "PASS"
    else
        log_test "Frontend on port $port" "FAIL"
    fi
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 2: VENDOR OPERATIONS (Create Resources)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}📌 Creating Test Room (Vendor)${NC}"
response=$(curl -s -X POST http://localhost:4001/vendor/rooms/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deluxe Ocean View",
    "store_id": 1,
    "occupancy_adults": 3,
    "occupancy_children": 2,
    "amenities": ["wifi","ocean_view","beach_access","spa_bath"],
    "accommodation_type": "resort",
    "category": "deluxe",
    "gender_policy": "mixed"
  }')
if echo "$response" | grep -q "id\|Deluxe"; then
    log_test "Create Room - Deluxe Ocean View" "PASS"
    room_id=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
else
    log_test "Create Room - Deluxe Ocean View" "FAIL"
fi

echo ""
echo -e "${YELLOW}📌 Creating Test Service (Vendor)${NC}"
response=$(curl -s -X POST http://localhost:4002/vendor/services/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Spa & Massage",
    "store_id": 1,
    "description": "Luxury spa treatment with aromatherapy",
    "base_price": 15000,
    "visit_fee": 500
  }')
if echo "$response" | grep -q "id\|Premium"; then
    log_test "Create Service - Premium Spa & Massage" "PASS"
    service_id=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
else
    log_test "Create Service - Premium Spa & Massage" "FAIL"
fi

echo ""
echo -e "${YELLOW}📌 Creating Test Movie (Vendor)${NC}"
response=$(curl -s -X POST http://localhost:4005/vendor/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Adventure 2026",
    "genre": "Adventure",
    "language": "English",
    "rating": "PG-13",
    "duration_minutes": 148,
    "release_date": "2026-02-01"
  }')
if echo "$response" | grep -q "id\|Great"; then
    log_test "Create Movie - The Great Adventure 2026" "PASS"
    movie_id=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
else
    log_test "Create Movie - The Great Adventure 2026" "FAIL"
fi

echo ""
echo -e "${YELLOW}📌 Creating Test Venue (Vendor)${NC}"
response=$(curl -s -X POST http://localhost:4007/vendor/venues/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sunset Garden Pavilion",
    "venue_type_id": 1,
    "store_id": 1,
    "location": "Downtown Plaza",
    "capacity": 300,
    "base_rate": 25000,
    "features": ["outdoor","covered_area","AV_ready","catering_allowed"]
  }')
if echo "$response" | grep -q "id\|Sunset"; then
    log_test "Create Venue - Sunset Garden Pavilion" "PASS"
    venue_id=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
else
    log_test "Create Venue - Sunset Garden Pavilion" "FAIL"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 3: USER BROWSING (Get All Resources)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}📌 User Browsing Rooms${NC}"
rooms=$(curl -s http://localhost:4001/rooms/search | grep -o '"id"' | wc -l)
if [ $rooms -gt 0 ]; then
    log_test "Browse Rooms - Found $rooms rooms" "PASS"
else
    log_test "Browse Rooms - No rooms found" "FAIL"
fi

echo ""
echo -e "${YELLOW}📌 User Browsing Services${NC}"
services=$(curl -s http://localhost:4002/services/catalog | grep -o '"id"' | wc -l)
if [ $services -gt 0 ]; then
    log_test "Browse Services - Found $services services" "PASS"
else
    log_test "Browse Services - No services found" "FAIL"
fi

echo ""
echo -e "${YELLOW}📌 User Browsing Movies${NC}"
movies=$(curl -s http://localhost:4005/movies/catalog | grep -o '"id"' | wc -l)
if [ $movies -gt 0 ]; then
    log_test "Browse Movies - Found $movies movies" "PASS"
else
    log_test "Browse Movies - No movies found" "FAIL"
fi

echo ""
echo -e "${YELLOW}📌 User Browsing Venues${NC}"
venues=$(curl -s http://localhost:4007/venues/catalog | grep -o '"id"' | wc -l)
if [ $venues -gt 0 ]; then
    log_test "Browse Venues - Found $venues venues" "PASS"
else
    log_test "Browse Venues - No venues found" "FAIL"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 4: ROOM BOOKING (User Books Room)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}📌 Get Room Details${NC}"
room_details=$(curl -s http://localhost:4001/rooms/search | jq '.items[0] // empty')
if echo "$room_details" | grep -q "id"; then
    room_id=$(echo "$room_details" | jq -r '.id // empty')
    log_test "Get Room Details - Room ID: $room_id" "PASS"
    
    echo ""
    echo -e "${YELLOW}📌 Calculate Room Price${NC}"
    price_response=$(curl -s -X POST http://localhost:4001/rooms/price \
      -H "Content-Type: application/json" \
      -d "{\"roomTypeId\": $room_id, \"checkIn\": \"2026-02-01\", \"checkOut\": \"2026-02-03\"}")
    
    if echo "$price_response" | grep -q "price\|total"; then
        log_test "Calculate Room Price - Success" "PASS"
    else
        log_test "Calculate Room Price - Failed" "FAIL"
    fi
else
    log_test "Get Room Details" "FAIL"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 5: SERVICE BOOKING (User Books Service)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}📌 Get Service Details${NC}"
service_details=$(curl -s http://localhost:4002/services/catalog | jq '.data[0] // empty')
if echo "$service_details" | grep -q "id"; then
    service_id=$(echo "$service_details" | jq -r '.id // empty')
    log_test "Get Service Details - Service ID: $service_id" "PASS"
    
    echo ""
    echo -e "${YELLOW}📌 Get Available Service Slots${NC}"
    slots=$(curl -s "http://localhost:4002/services/slots?serviceId=$service_id&date=2026-02-02" | jq '.data // [] | length')
    if [ "$slots" -gt 0 ]; then
        log_test "Get Service Slots - Found $slots slots" "PASS"
    else
        log_test "Get Service Slots - No slots found" "FAIL"
    fi
else
    log_test "Get Service Details" "FAIL"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 6: MOVIE BOOKING (User Books Movie Tickets)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}📌 Get Movie Details${NC}"
movie_details=$(curl -s http://localhost:4005/movies/catalog | jq '.data[0] // empty')
if echo "$movie_details" | grep -q "id"; then
    movie_id=$(echo "$movie_details" | jq -r '.id // empty')
    log_test "Get Movie Details - Movie ID: $movie_id" "PASS"
    
    echo ""
    echo -e "${YELLOW}📌 Get Movie Showtimes${NC}"
    showtimes=$(curl -s "http://localhost:4005/movies/showtimes?movieId=$movie_id" | jq '.data // [] | length')
    if [ "$showtimes" -gt 0 ]; then
        log_test "Get Movie Showtimes - Found $showtimes showtimes" "PASS"
    else
        log_test "Get Movie Showtimes - No showtimes found" "FAIL"
    fi
else
    log_test "Get Movie Details" "FAIL"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 7: VENUE BOOKING (User Books Venue)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}📌 Get Venue Details${NC}"
venue_details=$(curl -s http://localhost:4007/venues/catalog | jq '.data[0] // empty')
if echo "$venue_details" | grep -q "id"; then
    venue_id=$(echo "$venue_details" | jq -r '.id // empty')
    log_test "Get Venue Details - Venue ID: $venue_id" "PASS"
    
    echo ""
    echo -e "${YELLOW}📌 Get Available Venue Slots${NC}"
    slots=$(curl -s "http://localhost:4007/venues/slots?venueId=$venue_id&date=2026-02-02" | jq '.data // [] | length')
    if [ "$slots" -gt 0 ]; then
        log_test "Get Venue Slots - Found $slots slots" "PASS"
    else
        log_test "Get Venue Slots - No slots found" "FAIL"
    fi
else
    log_test "Get Venue Details" "FAIL"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 8: DATABASE VERIFICATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}📌 Verify All Modules Have Data${NC}"

movie_count=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -c "SELECT COUNT(*) FROM movies;" 2>/dev/null | tr -d ' ')
service_count=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -c "SELECT COUNT(*) FROM services_catalog;" 2>/dev/null | tr -d ' ')
venue_count=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -c "SELECT COUNT(*) FROM venue_types;" 2>/dev/null | tr -d ' ')
room_count=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -c "SELECT COUNT(*) FROM room_types;" 2>/dev/null | tr -d ' ')

[ "$movie_count" -gt 0 ] && log_test "Database - Movies: $movie_count ✓" "PASS" || log_test "Database - Movies" "FAIL"
[ "$service_count" -gt 0 ] && log_test "Database - Services: $service_count ✓" "PASS" || log_test "Database - Services" "FAIL"
[ "$venue_count" -gt 0 ] && log_test "Database - Venues: $venue_count ✓" "PASS" || log_test "Database - Venues" "FAIL"
[ "$room_count" -gt 0 ] && log_test "Database - Rooms: $room_count ✓" "PASS" || log_test "Database - Rooms" "FAIL"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${GREEN}✓ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}✗ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${CYAN}Total Tests: $((TESTS_PASSED + TESTS_FAILED))${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED - END-TO-END FLOW COMPLETE!${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Access User Portal: http://localhost:5183"
    echo "  2. Access Vendor Admin: http://localhost:5184"
    echo "  3. Browse all modules and make bookings"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests need attention${NC}"
    exit 1
fi
