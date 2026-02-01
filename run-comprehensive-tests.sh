#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      COMPREHENSIVE BOOKING SYSTEM TESTING SUITE              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_api() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    
    echo -e "\n${YELLOW}Testing: ${name}${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ $http_code =~ ^(200|201|204)$ ]]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        if [ -n "$body" ]; then
            echo -e "  Response: $(echo "$body" | head -c 200)"
        fi
        ((TESTS_FAILED++))
        return 1
    fi
}

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1. HEALTH CHECKS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

for port in 4000 4001 4002 4004 4005 4007; do
    if curl -s http://localhost:$port/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Service on port $port - OK"
    else
        echo -e "${RED}✗${NC} Service on port $port - FAILED"
    fi
done

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2. ROOMS BOOKING TESTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

test_api "GET Rooms Search" "GET" "http://localhost:4001/rooms/search"

test_api "POST Room Booking" "POST" "http://localhost:4001/rooms/book" \
    '{"userId":1,"roomTypeId":1,"checkIn":"2026-02-01","checkOut":"2026-02-03","guests":2}'

test_api "POST Room Price" "POST" "http://localhost:4001/rooms/price" \
    '{"roomTypeId":1,"checkIn":"2026-02-01","checkOut":"2026-02-03"}'

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3. SERVICES BOOKING TESTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

test_api "GET Services Catalog" "GET" "http://localhost:4002/services/catalog"

test_api "GET Service Slots" "GET" "http://localhost:4002/services/slots?serviceId=1&date=2026-02-02"

test_api "POST Service Booking" "POST" "http://localhost:4002/services/book" \
    '{"userId":1,"serviceId":1,"date":"2026-02-02","time":"09:00"}'

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}4. MOVIES BOOKING TESTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

test_api "GET Movies Catalog" "GET" "http://localhost:4005/movies/catalog"

test_api "GET Showtimes" "GET" "http://localhost:4005/movies/showtimes?movieId=1"

test_api "POST Movie Booking" "POST" "http://localhost:4005/movies/book" \
    '{"userId":1,"showtimeId":1,"seatIds":[1,2,3]}'

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}5. VENUES BOOKING TESTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

test_api "GET Venues Catalog" "GET" "http://localhost:4007/venues/catalog"

test_api "GET Venue Slots" "GET" "http://localhost:4007/venues/slots?venueId=1&date=2026-02-02"

test_api "POST Venue Booking" "POST" "http://localhost:4007/venues/book" \
    '{"userId":1,"venueId":1,"date":"2026-02-02","startTime":"10:00","endTime":"14:00","guestCount":50}'

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}6. FRONTEND ACCESSIBILITY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

for port in 5183 5184; do
    if curl -s http://localhost:$port/ >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend on port $port - Accessible"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} Frontend on port $port - Not accessible"
        ((TESTS_FAILED++))
    fi
done

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}7. DATABASE TESTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Check database connectivity
PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -c "SELECT 1;" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database connected"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} Database connection failed"
    ((TESTS_FAILED++))
fi

# Check test data
echo ""
movies=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -c "SELECT COUNT(*) FROM movies;" 2>/dev/null | tr -d ' ')
rooms=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -c "SELECT COUNT(*) FROM room_types;" 2>/dev/null | tr -d ' ')
services=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -c "SELECT COUNT(*) FROM services_catalog;" 2>/dev/null | tr -d ' ')
venues=$(PGPASSWORD=postgres psql -h localhost -U postgres -d mangwale_booking -t -c "SELECT COUNT(*) FROM venue_types;" 2>/dev/null | tr -d ' ')

echo -e "${GREEN}✓${NC} Movies: $movies"
echo -e "${GREEN}✓${NC} Room Types: $rooms"
echo -e "${GREEN}✓${NC} Services: $services"
echo -e "${GREEN}✓${NC} Venues: $venues"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

echo -e "${GREEN}✓ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}✗ Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED - SYSTEM READY FOR COMPREHENSIVE TESTING${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  REVIEW FAILURES ABOVE${NC}"
    exit 1
fi
