#!/bin/bash

echo "🌐 Starting Frontend Applications"
echo "======================================"
echo ""

cd /home/ubuntu/projects/additional-modules

echo "✅ Starting User Frontend..."
nohup pnpm --filter web-user dev > /tmp/web-user.log 2>&1 &

echo "✅ Starting Vendor Frontend..."  
nohup pnpm --filter web-vendor dev > /tmp/web-vendor.log 2>&1 &

echo ""
echo "⏳ Waiting for frontends to start (10 seconds)..."
sleep 10

echo ""
echo "📊 Frontend Status:"
echo "======================================"

# Check user frontend
if lsof -i :5173 > /dev/null 2>&1; then
    echo "✅ User Frontend - http://localhost:5173"
elif lsof -i :5187 > /dev/null 2>&1; then
    echo "✅ User Frontend - http://localhost:5187"
else
    echo "❌ User Frontend - check /tmp/web-user.log"
fi

# Check vendor frontend
if lsof -i :5174 > /dev/null 2>&1; then
    echo "✅ Vendor Frontend - http://localhost:5174"
elif lsof -i :5188 > /dev/null 2>&1; then
    echo "✅ Vendor Frontend - http://localhost:5188"
else
    echo "❌ Vendor Frontend - check /tmp/web-vendor.log"
fi

echo ""
echo "======================================"
echo "📝 Logs: tail -f /tmp/web-*.log"
echo "======================================"
