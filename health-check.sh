#!/bin/bash

# Service Health Check Script
echo "🏥 Mangwale V2 Health Check..."
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Services configuration
declare -A SERVICES
SERVICES[Gateway]="http://localhost:4000/health"
SERVICES[Rooms]="http://localhost:4001/health"
SERVICES[Services]="http://localhost:4002/health"  
SERVICES[Pricing]="http://localhost:4003/health"
SERVICES[Finance]="http://localhost:4004/health"

declare -A DOCS
DOCS[Gateway]="http://localhost:4000/docs"
DOCS[Rooms]="http://localhost:4001/docs"
DOCS[Services]="http://localhost:4002/docs"
DOCS[Pricing]="http://localhost:4003/docs"
DOCS[Finance]="http://localhost:4004/docs"

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local doc_url=$3
    
    printf "%-12s" "$name:"
    
    # Check health endpoint
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 5)
    
    if [ "$http_code" -eq 200 ]; then
        printf "${GREEN}✅ Healthy${NC}"
    else
        printf "${RED}❌ Down (${http_code})${NC}"
    fi
    
    # Check docs endpoint
    doc_code=$(curl -s -o /dev/null -w "%{http_code}" "$doc_url" --max-time 5)
    
    if [ "$doc_code" -eq 200 ]; then
        printf " ${GREEN}📚 Docs OK${NC}"
    else
        printf " ${RED}📚 Docs Failed${NC}"
    fi
    
    echo ""
}

# Check Docker containers
echo -e "\n🐳 Docker Containers:"
echo "====================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(mwv2|NAMES)"

# Check services
echo -e "\n🚀 Service Status:"
echo "=================="
for service in "${!SERVICES[@]}"; do
    check_service "$service" "${SERVICES[$service]}" "${DOCS[$service]}"
done

# Check processes
echo -e "\n🔄 Running Processes:"
echo "===================="
ps aux | grep -E "(concurrently|ts-node)" | grep -v grep | wc -l | xargs echo "Active Node processes:"

# Check ports
echo -e "\n🔌 Port Status:"
echo "==============="
for port in 4000 4001 4002 4003 4004; do
    if ss -tuln | grep -q ":$port "; then
        echo -e "Port $port: ${GREEN}✅ Open${NC}"
    else
        echo -e "Port $port: ${RED}❌ Closed${NC}"
    fi
done

# Quick API test
echo -e "\n⚡ Quick API Tests:"
echo "=================="
curl -s http://localhost:4000/health > /dev/null 2>&1 && echo -e "Gateway API: ${GREEN}✅ Responding${NC}" || echo -e "Gateway API: ${RED}❌ Not responding${NC}"

echo -e "\n📊 System Summary:"
echo "=================="
echo "• All Docker containers running: $(docker ps | grep -c mwv2)/2"
echo "• Services accessible via browser at:"
echo "  - Gateway Docs: http://localhost:4000/docs"
echo "  - Rooms Docs: http://localhost:4001/docs" 
echo "  - Services Docs: http://localhost:4002/docs"
echo "  - Pricing Docs: http://localhost:4003/docs"
echo "  - Finance Docs: http://localhost:4004/docs"

echo -e "\n🎉 Health check completed!"
