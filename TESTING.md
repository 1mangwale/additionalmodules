# 🧪 Mangwale V2 Testing Guide

## Quick Testing Commands

### 1. Start All Services
```bash
# Start in background (recommended)
cd "/home/ubuntu/Devs/Addtional Modules"
nohup npm run dev:all > services.log 2>&1 &

# Or start in foreground (will occupy terminal)
npm run dev:all
```

### 2. Health Check
```bash
./health-check.sh
```

### 3. API Testing  
```bash
./test-api.sh
```

### 4. Database Testing
```bash
./test-database-fixed.sh
```

## Manual Testing Methods

### Browser Testing (Recommended)
Open these URLs in your browser for interactive API testing:

- **Gateway:** http://localhost:4000/docs
- **Rooms:** http://localhost:4001/docs  
- **Services:** http://localhost:4002/docs
- **Pricing:** http://localhost:4003/docs
- **Finance:** http://localhost:4004/docs

### Command Line Testing
```bash
# Health check
curl http://localhost:4000/health

# Room search
curl "http://localhost:4001/rooms/search?checkin=2025-09-15&checkout=2025-09-16&guests=2"

# Room pricing
curl -X POST http://localhost:4001/rooms/price \
  -H "Content-Type: application/json" \
  -d '{"checkin":"2025-09-15","checkout":"2025-09-16","room_type_id":1,"guests":2}'

# Services catalog
curl http://localhost:4002/services/catalog

# Pricing quote
curl -X POST http://localhost:4003/pricing/quote \
  -H "Content-Type: application/json" \
  -d '{"module":"room","base_amount":10000,"metadata":{"room_type":"deluxe"}}'

# Bridge ping
curl -X POST http://localhost:4004/bridge/ping \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Database Testing

### Direct Database Access
```bash
# Connect to database
docker exec -it mwv2-postgres psql -U postgres -d mangwale_booking

# Sample queries
\dt                                          # List tables
SELECT COUNT(*) FROM room_types;             # Count room types
SELECT * FROM services_catalog LIMIT 5;     # Show services
```

### Insert Test Data
```sql
-- Room type
INSERT INTO room_types (store_id, name, occupancy_adults, occupancy_children) 
VALUES (1, 'Deluxe Room', 2, 1);

-- Service
INSERT INTO services_catalog (store_id, name, category, base_price) 
VALUES (1, 'Spa Massage', 'spa', 5000);

-- Pricing slab (need vendor_id)
INSERT INTO vendor_pricing_slabs (vendor_id, module, name, basis, method, value, tag) 
VALUES (1, 'room', 'Weekend Surcharge', 'weekend', 'percent', 20, 'price');
```

## Development Workflow

### 1. Making Changes
- Edit code in VS Code
- Services auto-reload with `ts-node-dev`
- Test changes immediately

### 2. Debugging
```bash
# View service logs
tail -f services.log

# Check specific service
ps aux | grep -E "(gateway|rooms|services|pricing|finance)"

# Kill and restart if needed
pkill -f "npm run dev"
npm run dev:all
```

### 3. Production Testing
```bash
# Build all services
npm run build --workspaces

# Run built version (if needed)
npm start
```

## Common Issues & Solutions

### Services Not Starting
```bash
# Check if ports are in use
ss -tuln | grep -E ":400[0-4]"

# Kill conflicting processes
pkill -f "ts-node"

# Restart
npm run dev:all
```

### Database Connection Issues
```bash
# Check Docker container
docker ps | grep postgres

# Restart if needed
docker restart mwv2-postgres

# Verify connection
docker exec mwv2-postgres psql -U postgres -d mangwale_booking -c "SELECT 1"
```

### API Errors
- Check service logs: `tail -f services.log`
- Verify JSON format in requests
- Check database schema matches your queries
- Use Swagger docs for proper request format

## Testing Checklist

- [ ] Docker containers running
- [ ] All 5 services start successfully  
- [ ] Database connections work
- [ ] Swagger docs accessible
- [ ] Health endpoints respond
- [ ] Sample API calls work
- [ ] Database queries execute
- [ ] Test data can be inserted

## Next Steps

1. **Add Real Data:** Insert actual room types, services, pricing rules
2. **Test Business Logic:** Create booking flows, pricing calculations
3. **Integration Testing:** Test service-to-service communication
4. **Performance Testing:** Load test with multiple requests
5. **Error Handling:** Test invalid inputs, edge cases

Your Mangwale V2 system is fully operational and ready for development! 🚀
