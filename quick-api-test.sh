#!/bin/bash

# Quick API Test Script
echo "🧪 Quick API Test"
echo "=================="

# Test each service
test_service() {
    local name=$1
    local url=$2
    response=$(curl -s -w "\n%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>/dev/null)
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status" = "200" ]; then
        echo "✅ $name: OK"
        echo "   Response: ${body:0:100}..."
    else
        echo "❌ $name: FAILED (Status: $status)"
    fi
}

echo ""
echo "1. Gateway Health"
test_service "Gateway" "http://localhost:4000/health"

echo ""
echo "2. Rooms API"
test_service "Rooms Health" "http://localhost:4001/rooms/health"
test_service "Rooms Search" "http://localhost:4001/rooms/search?store_id=1"

echo ""
echo "3. Services API"  
test_service "Services Health" "http://localhost:4002/services/health"
test_service "Services Catalog" "http://localhost:4002/services/catalog"

echo ""
echo "4. Movies API"
test_service "Movies Health" "http://localhost:4005/movies/health"
test_service "Movies Catalog" "http://localhost:4005/movies/catalog"

echo ""
echo "5. Venues API"
test_service "Venues Health" "http://localhost:4007/venues/health"
test_service "Venues Catalog" "http://localhost:4007/venues/catalog"

echo ""
echo "6. Finance Bridge"
test_service "Finance Health" "http://localhost:4004/bridge/health"

echo ""
echo "📊 Database Status"
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c "
SELECT 
  'room_types' as tbl, COUNT(*)::text as cnt FROM room_types
UNION ALL SELECT 'services_catalog', COUNT(*)::text FROM services_catalog  
UNION ALL SELECT 'movies', COUNT(*)::text FROM movies
UNION ALL SELECT 'venue_types', COUNT(*)::text FROM venue_types
UNION ALL SELECT 'venue_slots', COUNT(*)::text FROM venue_slots
ORDER BY tbl;
" 2>/dev/null | grep -v "row"

echo ""
echo "Test complete!"
