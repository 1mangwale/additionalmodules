#!/bin/bash

# Interactive Testing Menu for Mangwale V2
echo "🧪 Mangwale V2 Interactive Testing"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_menu() {
    echo -e "\n${BLUE}Choose what to test:${NC}"
    echo "1. Health Check All Services"
    echo "2. Test Gateway API"
    echo "3. Test Rooms API"
    echo "4. Test Services API"
    echo "5. Test Pricing API"
    echo "6. Test Finance Bridge API"
    echo "7. Run All API Tests"
    echo "8. Test Database"
    echo "9. Open Swagger Docs (URLs)"
    echo "0. Exit"
    echo -n "Enter choice [0-9]: "
}

test_gateway() {
    echo -e "${YELLOW}Testing Gateway...${NC}"
    echo "Health Check:"
    curl -s http://localhost:4000/health | jq .
}

test_rooms() {
    echo -e "${YELLOW}Testing Rooms Service...${NC}"
    echo "1. Room Search:"
    curl -s "http://localhost:4001/rooms/search?checkin=2025-09-15&checkout=2025-09-16&guests=2" | jq .
    echo -e "\n2. Room Pricing:"
    curl -s -X POST http://localhost:4001/rooms/price \
        -H "Content-Type: application/json" \
        -d '{"checkin":"2025-09-15","checkout":"2025-09-16","room_type_id":1,"guests":2}' | jq .
}

test_services() {
    echo -e "${YELLOW}Testing Services API...${NC}"
    echo "1. Services Catalog:"
    curl -s http://localhost:4002/services/catalog | jq .
    echo -e "\n2. Service Slots:"
    curl -s "http://localhost:4002/services/slots?service_id=1&date=2025-09-15" | jq .
}

test_pricing() {
    echo -e "${YELLOW}Testing Pricing Service...${NC}"
    echo "Pricing Quote:"
    curl -s -X POST http://localhost:4003/pricing/quote \
        -H "Content-Type: application/json" \
        -d '{"module":"room","base_amount":10000,"metadata":{"room_type":"deluxe"}}' | jq .
}

test_finance() {
    echo -e "${YELLOW}Testing Finance Bridge...${NC}"
    echo "1. Bridge Ping:"
    curl -s -X POST http://localhost:4004/bridge/ping \
        -H "Content-Type: application/json" \
        -d '{}' | jq .
    echo -e "\n2. Demo Hold (may fail - that's normal):"
    curl -s -X POST http://localhost:4004/bridge/demo/hold \
        -H "Content-Type: application/json" \
        -d '{"amount":5000,"currency":"INR","customer_id":"test123"}' | jq .
}

show_swagger_urls() {
    echo -e "${GREEN}Swagger Documentation URLs:${NC}"
    echo "Gateway:  http://localhost:4000/docs"
    echo "Rooms:    http://localhost:4001/docs"
    echo "Services: http://localhost:4002/docs"
    echo "Pricing:  http://localhost:4003/docs"
    echo "Finance:  http://localhost:4004/docs"
    echo -e "\n${YELLOW}Open these in your browser for interactive testing!${NC}"
}

while true; do
    show_menu
    read choice
    
    case $choice in
        1) ./health-check.sh ;;
        2) test_gateway ;;
        3) test_rooms ;;
        4) test_services ;;
        5) test_pricing ;;
        6) test_finance ;;
        7) ./test-api.sh ;;
        8) ./test-database-fixed.sh ;;
        9) show_swagger_urls ;;
        0) echo "Goodbye!"; exit 0 ;;
        *) echo "Invalid option. Please try again." ;;
    esac
    
    echo -e "\nPress Enter to continue..."
    read
done
