#!/bin/bash

echo "🚀 Starting All Mangwale Services (Clean Start)"
echo "=================================================="
echo ""

# Stop any existing dev processes first
./stop-dev-safe.sh 2>/dev/null

sleep 2

echo "Starting services in background..."
echo ""

# Start each service in background with nohup (won't die when terminal closes)
cd /home/ubuntu/projects/additional-modules

echo "✅ Gateway (4000)..."
nohup pnpm --filter @mangwale/gateway dev > /tmp/gateway.log 2>&1 &

echo "✅ Rooms (4001)..."
nohup pnpm --filter @mangwale/rooms dev > /tmp/rooms.log 2>&1 &

echo "✅ Services API (4002)..."
nohup pnpm --filter @mangwale/services-api dev > /tmp/services-api.log 2>&1 &

echo "✅ Bridge Finance (4004)..."
nohup pnpm --filter @mangwale/bridge-finance dev > /tmp/bridge-finance.log 2>&1 &

echo "✅ Movies (4005)..."
nohup pnpm --filter @mangwale/movies dev > /tmp/movies.log 2>&1 &

echo "✅ Venues (4007)..."
nohup pnpm --filter @mangwale/venues dev > /tmp/venues.log 2>&1 &

echo ""
echo "⏳ Waiting for services to start (15 seconds)..."
sleep 15

echo ""
echo "📊 Checking Service Status..."
echo "======================================"

check_service() {
    local name=$1
    local port=$2
    
    if curl -s http://localhost:$port/health > /dev/null 2>&1 || curl -s http://localhost:$port/ > /dev/null 2>&1; then
        echo "✅ $name (port $port) - RUNNING"
    else
        echo "❌ $name (port $port) - DOWN (check /tmp/${name,,}.log)"
    fi
}

check_service "Gateway" 4000
check_service "Rooms" 4001
check_service "Services" 4002
check_service "Finance" 4004
check_service "Movies" 4005
check_service "Venues" 4007

echo ""
echo "======================================"
echo "📝 Logs available in /tmp/*.log"
echo "🛑 Stop all: ./stop-dev-safe.sh"
echo "🔄 Restart: ./start-clean.sh"
echo ""
echo "📚 Swagger Docs:"
echo "   http://localhost:4000/docs (Gateway)"
echo "   http://localhost:4002/docs (Services)"
echo "   http://localhost:4007/docs (Venues)"
echo "======================================"
