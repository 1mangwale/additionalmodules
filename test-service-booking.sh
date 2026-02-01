#!/bin/bash

# Service Booking Test Suite
# Tests comprehensive service appointment booking flow

set -e
BASE_URL="http://localhost:4007"
VENDOR_ID=101
USER_ID=301

echo "🧪 Service Booking Test Suite"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

test_count=0
pass_count=0

function test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    test_count=$((test_count + 1))
    echo ""
    echo -e "${BLUE}Test $test_count: $name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        pass_count=$((pass_count + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        echo "$body"
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        echo "$body"
    fi
}

echo ""
echo "📋 Step 1: Create Service Categories"
echo "======================================="

# Test 1: Create Plumber service
plumber_response=$(curl -s -X POST "$BASE_URL/vendor/services/catalog" \
    -H "Content-Type: application/json" \
    -d '{
        "vendor_id": '$VENDOR_ID',
        "service_name": "Plumber",
        "description": "Professional plumbing services",
        "category": "Home Services",
        "base_rate": 500,
        "unit": "per_visit",
        "duration_minutes": 60,
        "is_active": true
    }')
echo "$plumber_response" | jq '.'
plumber_id=$(echo "$plumber_response" | jq -r '.service_id')
echo "Created Plumber service: $plumber_id"

# Test 2: Create Electrician service
electrician_response=$(curl -s -X POST "$BASE_URL/vendor/services/catalog" \
    -H "Content-Type: application/json" \
    -d '{
        "vendor_id": '$VENDOR_ID',
        "service_name": "Electrician",
        "description": "Electrical repairs and installations",
        "category": "Home Services",
        "base_rate": 600,
        "unit": "per_visit",
        "duration_minutes": 90,
        "is_active": true
    }')
echo "$electrician_response" | jq '.'
electrician_id=$(echo "$electrician_response" | jq -r '.service_id')
echo "Created Electrician service: $electrician_id"

# Test 3: Create House Cleaning service
cleaning_response=$(curl -s -X POST "$BASE_URL/vendor/services/catalog" \
    -H "Content-Type: application/json" \
    -d '{
        "vendor_id": '$VENDOR_ID',
        "service_name": "House Cleaning",
        "description": "Professional home cleaning service",
        "category": "Home Services",
        "base_rate": 800,
        "unit": "per_hour",
        "duration_minutes": 120,
        "is_active": true
    }')
echo "$cleaning_response" | jq '.'
cleaning_id=$(echo "$cleaning_response" | jq -r '.service_id')
echo "Created House Cleaning service: $cleaning_id"

echo ""
echo "📅 Step 2: Create Service Slots"
echo "======================================="

# Test 4: Create morning slots for Plumber (next 7 days)
for day in {0..6}; do
    slot_date=$(date -d "+$day days" +%Y-%m-%d)
    
    # Morning slot: 9 AM
    slot_response=$(curl -s -X POST "$BASE_URL/vendor/services/slots" \
        -H "Content-Type: application/json" \
        -d '{
            "service_id": '$plumber_id',
            "slot_date": "'$slot_date'",
            "slot_time": "09:00:00",
            "capacity": 2,
            "is_available": true
        }')
    echo "Created morning slot for $slot_date"
    
    # Afternoon slot: 2 PM
    slot_response=$(curl -s -X POST "$BASE_URL/vendor/services/slots" \
        -H "Content-Type: application/json" \
        -d '{
            "service_id": '$plumber_id',
            "slot_date": "'$slot_date'",
            "slot_time": "14:00:00",
            "capacity": 2,
            "is_available": true
        }')
    echo "Created afternoon slot for $slot_date"
done

echo "Created 14 slots for Plumber service"

echo ""
echo "🏪 Step 3: Create Vendor Store"
echo "======================================="

# Test 5: Create vendor store location - Store in DB directly
store_query="INSERT INTO vendor_stores (vendor_id, store_name, address, latitude, longitude, city, is_active) 
VALUES ($VENDOR_ID, 'Main Service Center', '123 Service Street, Mumbai', 19.0760, 72.8777, 'Mumbai', true) 
RETURNING store_id;"
store_id=$(docker exec mangwale-postgres psql -U mangwale -d mangwale_dev -t -c "$store_query" | tr -d ' ')
echo "Created Store: $store_id"

echo ""
echo "🔍 Step 4: Search Available Services"
echo "======================================="

# Test 6: Get all services
test_endpoint "Get all services" "GET" "/services/catalog?vendor_id=$VENDOR_ID" "" "200"

# Test 7: Get service by ID
test_endpoint "Get Plumber service" "GET" "/services/$plumber_id" "" "200"

echo ""
echo "📆 Step 5: Check Available Slots"
echo "======================================="

tomorrow=$(date -d "+1 day" +%Y-%m-%d)

# Test 8: Get available slots for tomorrow
test_endpoint "Get available slots" "GET" "/services/slots?service_id=$plumber_id&date=$tomorrow" "" "200"

# Get a slot ID for booking
slot_response=$(curl -s "$BASE_URL/services/slots?service_id=$plumber_id&date=$tomorrow")
slot_id=$(echo "$slot_response" | jq -r '.[0].slot_id' 2>/dev/null || echo "")
if [ -z "$slot_id" ] || [ "$slot_id" = "null" ]; then
    slot_id=$(echo "$slot_response" | jq -r '.[0].id' 2>/dev/null)
fi
echo "Selected slot ID: $slot_id"

echo ""
echo "🎫 Step 6: Create Service Appointment"
echo "======================================="
Id": '$USER_ID',
    "serviceId": '$plumber_id',
    "slotId": '$slot_id',
    "storeId": '$store_id',
    "customerName": "John Doe",
    "customerPhone": "9876543210",
    "customerAddress": "456 Customer Avenue, Mumbai",
    "latitude": 19.1136,
    "longitude": 72.8697,
    "city": "Mumbai",
    "notes": "Bathroom sink leaking",
    "paymentMode": "prepaid"
}'

booking_response=$(curl -s -X POST "$BASE_URL/services/book" \
    -H "Content-Type: application/json" \
    -d "$booking_data")
echo "$booking_response" | jq '.'
appointment_id=$(echo "$booking_response" | jq -r '.appointment_id // .id // .appointmentId' 2>/dev/null)
echo "Created Appointment: $appointment_id"

# Extract amounts
base_amount=$(echo "$booking_response" | jq -r '.base_amount // .baseAmount // 0')
visit_fee=$(echo "$booking_response" | jq -r '.visit_fee // .visitFee // 0')
total_amount=$(echo "$booking_response" | jq -r '.total_amount // .totalAmount // .amount // 0
base_amount=$(echo "$booking_response" | jq -r '.base_amount')
visit_fee=$(echo "$booking_response" | jq -r '.visit_fee')
total_amount=$(echo "$booking_response" | jq -r '.total_amount')

echo ""
echo "💰 Booking Summary:"
echo "   Base Rate: ₹$base_amount"
echo "   Visit Fee: ₹$visit_fee"
echo "   Total Amount: ₹$total_amount"

if [ "$appointment_id" != "null" ]; then
    test_count=$((test_count + 1))
    pass_count=$((pass_count + 1))
    echo -e "${GREEN}✓ Test $test_count: PASS - Appointment created${NC}"
else
    test_count=$((test_count + 1))
    echo -e "${RED}✗ Test $test_count: FAIL - Appointment creation failed${NC}"
fi

echo ""
echo "🔍 Step 7: Verify Booking"
echo "======================================="

# Test 10: Get appointment by ID
test_endpoint "Get appointment details" "GET" "/services/appointments/$appointment_id" "" "200"

# Test 11: Get user's appointments
test_endpoint "Get user appointments" "GET" "/services/my-appointments?userId=$USER_ID" "" "200"

# Test 12: Verify slot capacity reduced
slot_check=$(curl -s "$BASE_URL/services/slots?service_id=$plumber_id&date=$tomorrow")
echo "$slot_check" | jq '.'
booked_count=$(echo "$slot_check" | jq -r '.[0].booked_count // .[0].bookedCount // 0')
available_capacity=$(echo "$slot_check" | jq -r '.[0].available_capacity // .[0].availableCapacity // 0')

echo ""
echo "📊 Slot Status:"
echo "   Booked: $booked_count"
echo "   Available: $available_capacity"

if [ "$booked_count" = "1" ] && [ "$available_capacity" = "1" ]; then
    test_count=$((test_count + 1))
    pass_count=$((pass_count + 1))
    echo -e "${GREEN}✓ Test $test_count: PASS - Slot capacity correctly updated${NC}"
else
    test_count=$((test_count + 1))
    echo -e "${RED}✗ Test $test_count: FAIL - Slot capacity mismatch${NC}"
fi

echo ""
echo "🔄 Step 8: Update Appointment Status"
echo "======================================="

# Test 13: Skip confirm - test complete instead
# test_endpoint "Confirm appointment" "POST" "/vendor/appointments/$appointment_id/confirm" '{}' "200"

# Test 14: Complete service
test_endpoint "Complete service" "POST" "/services/complete" '{"jobId": "'$appointment_id'", "additionsMinor": 0}' "200"

echo ""
echo "❌ Step 9: Cancel Appointment"
echo "======================================="

# Test 15: Cancel appointment (create new one first)
booking_data2='{
    "userId": '$USER_ID',
    "serviceId": '$plumber_id',
    "slotId": '$slot_id',
    "storeId": '$store_id',
    "customerName": "Jane Doe",
    "customerPhone": "9876543211",
    "customerAddress": "789 Test Street, Mumbai",
    "latitude": 19.1136,
    "longitude": 72.8697,
    "city": "Mumbai",
    "paymentMode": "prepaid"
}'
booking2_response=$(curl -s -X POST "$BASE_URL/services/book" \
    -H "Content-Type: application/json" \
    -d "$booking_data2")
appointment_id2=$(echo "$booking2_response" | jq -r '.appointment_id // .id // .appointmentId')
total_amount2=$(echo "$booking2_response" | jq -r '.total_amount // .totalAmount // .amount // 0')

cancel_response=$(curl -s -X POST "$BASE_URL/services/cancel" \
    -H "Content-Type: application/json" \
    -d '{"jobId": "'$appointmenafter cancellation
slot_final=$(curl -s "$BASE_URL/services/slots?service_id=$plumber_id&date=$tomorrow")
echo "$slot_final" | jq '.'
final_booked=$(echo "$slot_final" | jq -r '.[0].booked_count // .[0].bookedCount // 0')
final_available=$(echo "$slot_final" | jq -r '.[0].available_capacity // .[0].availableCapacity // 0')

echo ""
echo "📊 Final Slot Status:"
echo "   Booked: $final_booked"
echo "   Available: $final_available"

# Expect 1 booked (first appointment completed) and 1 available (second cancelled)
if [ "$final_booked" = "1" ] && [ "$final_available" = "1" ]; then
    test_count=$((test_count + 1))
    pass_count=$((pass_count + 1))
    echo -e "${GREEN}✓ Test $test_count: PASS - Slot capacity correctly managed${NC}"
else
    test_count=$((test_count + 1))
    echo -e "${RED}✗ Test $test_count: FAIL - Slot capacity mismatch (expected 1 booked, 1 available)

# Test 16: Check slot capacity restored
slot_final=$(curl -s "$BASE_URL/service-slots?service_id=$plumber_id&date=$tomorrow")
echo "$slot_final" | jq '.'
final_booked=$(echo "$slot_final" | jq -r '.[0].booked_count')
final_available=$(echo "$slot_final" | jq -r '.[0].available_capacity')
services/book" '{
    "userId": '$USER_ID',
    "serviceId": '$plumber_id',
    "slotId": 99999,
    "storeId": '$store_id',
    "customerName": "Test User",
    "customerPhone": "1234567890",
    "customerAddress": "Test Address",
    "latitude": 19.1136,
    "longitude": 72.8697,
    "city": "Mumbai",
    "paymentMode": "cash_on_delivery"
}' "404"

# Test 18: Get non-existent appointment
test_endpoint "Get non-existent appointment" "GET" "/services
echo "🧪 Step 11: Test Edge Cases"
echo "======================================="

# Test 17: Try booking unavailable slot
test_endpoint "Book unavailable slot" "POST" "/appointments" '{
    "user_id": '$USER_ID',
    "service_id": '$plumber_id',
    "slot_id": 99999,
    "store_id": '$store_id',
    "customer_name": "Test User",
    "customer_phone": "1234567890",
    "customer_address": "Test Address",
    "latitude": 19.1136,
    "longitude": 72.8697,
    "city": "Mumbai",
    "payment_mode": "cash_on_delivery"
}' "404"

# Test 18: Get non-existent appointment
test_endpoint "Get non-existent appointment" "GET" "/appointments/999999" "" "404"

echo ""
echo "======================================="
echo "📊 FINAL TEST RESULTS"
echo "======================================="
echo -e "Total Tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $((test_count - pass_count))${NC}"
echo -e "Success Rate: $(( pass_count * 100 / test_count ))%"
echo ""

if [ $pass_count -eq $test_count ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    exit 1
fi
