# 🚀 Quick Testing Cheat Sheet

## Fastest Ways to Test

### 1. Quick Health Check
```bash
./health-check.sh
```

### 2. Test All APIs at Once
```bash
./test-api.sh
```

### 3. Interactive Testing Menu
```bash
./interactive-test.sh
```

### 4. Browser Testing (Easiest!)
- Gateway: http://localhost:4000/docs
- Rooms: http://localhost:4001/docs
- Services: http://localhost:4002/docs
- Pricing: http://localhost:4003/docs
- Finance: http://localhost:4004/docs

## Individual API Tests

### Gateway
```bash
curl http://localhost:4000/health
```

### Rooms
```bash
# Search rooms
curl "http://localhost:4001/rooms/search?checkin=2025-09-15&checkout=2025-09-16&guests=2"

# Get pricing
curl -X POST http://localhost:4001/rooms/price \
  -H "Content-Type: application/json" \
  -d '{"checkin":"2025-09-15","checkout":"2025-09-16","room_type_id":1,"guests":2}'
```

### Services
```bash
# Get catalog
curl http://localhost:4002/services/catalog

# Get slots
curl "http://localhost:4002/services/slots?service_id=1&date=2025-09-15"
```

### Pricing
```bash
curl -X POST http://localhost:4003/pricing/quote \
  -H "Content-Type: application/json" \
  -d '{"module":"room","base_amount":10000,"metadata":{"room_type":"deluxe"}}'
```

### Finance
```bash
curl -X POST http://localhost:4004/bridge/ping \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Database Testing
```bash
./test-database-fixed.sh
```

## Service Management
```bash
# Check if running
ps aux | grep concurrently

# Start services
npm run dev:all

# Start in background
nohup npm run dev:all > services.log 2>&1 &
```

## Your System Status: ✅ WORKING!
- All 5 services running
- All APIs responding 
- Database connected
- Swagger docs accessible
- Ready for development!
