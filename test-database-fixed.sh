#!/bin/bash

# Working Database Test with Correct Schema
echo "🗄️ Testing Database with Correct Schema..."
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

# Check actual table structures
run_query "\d room_types" "Room types table structure"
run_query "\d services_catalog" "Services catalog table structure" 
run_query "\d vendor_pricing_slabs" "Vendor pricing slabs table structure"

# Test sample data queries
run_query "SELECT COUNT(*) as room_types FROM room_types;" "Count room types"
run_query "SELECT COUNT(*) as services FROM services_catalog;" "Count services"
run_query "SELECT COUNT(*) as pricing_slabs FROM vendor_pricing_slabs;" "Count pricing slabs"

# Insert correct test data
echo -e "\n🧪 Inserting test data with correct schema..."

# Insert test room type (using actual columns)
run_query "INSERT INTO room_types (store_id, name, occupancy_adults, occupancy_children, status) VALUES (1, 'Test Suite', 4, 2, 1) ON CONFLICT DO NOTHING;" "Insert test room type"

# Insert test service (check columns first)
run_query "\d services_catalog" "Check services_catalog structure"

# For now, let's just verify the room type insertion worked
run_query "SELECT id, name, occupancy_adults, status FROM room_types WHERE name LIKE 'Test%';" "Show inserted room types"

echo -e "\n🎉 Database testing with correct schema completed!"
