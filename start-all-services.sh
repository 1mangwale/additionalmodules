#!/bin/bash

echo "🚀 Starting all Mangwale services..."
echo "=================================="
echo ""

# Kill existing instances
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "node.*apps" 2>/dev/null || true
sleep 2

# Start services in background
echo "Starting Gateway (port 4000)..."
cd /home/ubuntu/projects/additional-modules && pnpm --filter gateway dev > /tmp/gateway.log 2>&1 &
sleep 2

echo "Starting Rooms (port 4001)..."
cd /home/ubuntu/projects/additional-modules && pnpm --filter rooms dev > /tmp/rooms.log 2>&1 &
sleep 2

echo "Starting Services (port 4002)..."
cd /home/ubuntu/projects/additional-modules && pnpm --filter services-api dev > /tmp/services.log 2>&1 &
sleep 2

echo "Starting Finance Bridge (port 4004)..."
cd /home/ubuntu/projects/additional-modules && pnpm --filter bridge-finance dev > /tmp/finance.log 2>&1 &
sleep 2

echo "Starting Movies (port 4005)..."
cd /home/ubuntu/projects/additional-modules && pnpm --filter movies dev > /tmp/movies.log 2>&1 &
sleep 2

echo "Starting Venues (port 4007)..."
cd /home/ubuntu/projects/additional-modules && pnpm --filter venues dev > /tmp/venues.log 2>&1 &
sleep 5

echo ""
echo "✅ All services started!"
echo ""
echo "Checking health..."
echo "===================="

check_health() {
  local name=$1
  local port=$2
  if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
    echo "✅ $name (port $port) - UP"
  else
    echo "❌ $name (port $port) - DOWN"
  fi
}

check_health "Gateway" 4000
check_health "Rooms" 4001
check_health "Services" 4002
check_health "Finance" 4004
check_health "Movies" 4005
check_health "Venues" 4007

echo ""
echo "📝 Logs are in /tmp/*.log"
echo "🧪 Run tests with: ./run-all-tests.sh"
echo "🛑 Stop all with: pkill -f 'tsx watch'"
echo ""
