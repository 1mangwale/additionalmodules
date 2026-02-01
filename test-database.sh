#!/bin/bash

# Database Testing Script
echo "🗄️ Testing Database Connection and Data..."
echo "==========================================="

# Function to run database query
run_query() {
    local query=$1
    local description=$2
    
    echo -e "\n📋 $description"
    echo "Query: $query"
    echo "Result:"
    docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c "$query"
}

# Test database connectivity
echo "Testing database connectivity..."
run_query "\dt" "List all tables"

# Test sample data queries
run_query "SELECT COUNT(*) as room_types FROM room_types;" "Count room types"
run_query "SELECT COUNT(*) as services FROM services_catalog;" "Count services"
run_query "SELECT COUNT(*) as pricing_slabs FROM vendor_pricing_slabs;" "Count pricing slabs"

# Insert some test data
echo -e "\n🧪 Inserting test data..."
run_query "INSERT INTO room_types (name, description, base_price, max_occupancy) VALUES ('Test Suite', 'Testing room type', 15000, 4) ON CONFLICT DO NOTHING;" "Insert test room type"

run_query "INSERT INTO services_catalog (name, description, category, duration_minutes, base_price) VALUES ('Test Service', 'Testing service', 'spa', 60, 5000) ON CONFLICT DO NOTHING;" "Insert test service"

run_query "INSERT INTO vendor_pricing_slabs (module, name, basis, method, value, tag, priority, active) VALUES ('room', 'Test Weekend Surcharge', 'weekend', 'percent', 20, 'price', 1, true) ON CONFLICT DO NOTHING;" "Insert test pricing slab"

# Verify inserted data
echo -e "\n✅ Verifying test data..."
run_query "SELECT name, base_price FROM room_types WHERE name LIKE 'Test%';" "Show test room types"
run_query "SELECT name, base_price FROM services_catalog WHERE name LIKE 'Test%';" "Show test services"
run_query "SELECT name, method, value FROM vendor_pricing_slabs WHERE name LIKE 'Test%';" "Show test pricing slabs"

echo -e "\n🎉 Database testing completed!"
