#!/bin/bash

# Mangwale V2 API Testing Script
echo "🧪 Testing Mangwale V2 APIs..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "  $method $url"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "  ${GREEN}✅ Success ($http_code)${NC}"
        echo "  Response: $body"
    else
        echo -e "  ${RED}❌ Failed ($http_code)${NC}"
        echo "  Response: $body"
    fi
}

# Wait for services to start
echo "Waiting 10 seconds for services to fully start..."
sleep 10

echo -e "\n🏥 Gateway Service Tests (Port 4000)"
echo "======================================"
test_endpoint "GET" "http://localhost:4000/health" "" "Health Check"

echo -e "\n🏠 Rooms Service Tests (Port 4001)"
echo "=================================="
test_endpoint "GET" "http://localhost:4001/rooms/search?checkin=2025-09-15&checkout=2025-09-16&guests=2" "" "Room Search"
test_endpoint "POST" "http://localhost:4001/rooms/price" '{"checkin":"2025-09-15","checkout":"2025-09-16","room_type_id":1,"guests":2}' "Room Pricing"

echo -e "\n⚙️ Services API Tests (Port 4002)"
echo "================================="
test_endpoint "GET" "http://localhost:4002/services/catalog" "" "Services Catalog"
test_endpoint "GET" "http://localhost:4002/services/slots?service_id=1&date=2025-09-15" "" "Service Slots"

echo -e "\n💰 Pricing Service Tests (Port 4003)"
echo "===================================="
test_endpoint "POST" "http://localhost:4003/pricing/quote" '{"module":"room","base_amount":10000,"metadata":{"room_type":"deluxe","duration":1}}' "Pricing Quote"

echo -e "\n💳 Finance Bridge Tests (Port 4004)"
echo "=================================="
test_endpoint "POST" "http://localhost:4004/bridge/ping" '{}' "Bridge Ping"
test_endpoint "POST" "http://localhost:4004/bridge/demo/hold" '{"amount":5000,"currency":"INR","customer_id":"test123"}' "Demo Hold"

echo -e "\n🎉 Testing completed!"
