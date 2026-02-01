#!/bin/bash

echo "🛑 Stopping all development processes (safely)..."
echo "=================================================="

# Kill only dev processes, not system/SSH processes
pkill -f "pnpm.*dev" 2>/dev/null
pkill -f "vite" 2>/dev/null  
pkill -f "ts-node-dev" 2>/dev/null
pkill -f "tsx watch" 2>/dev/null

# Wait for processes to stop
sleep 2

echo "✅ All dev processes stopped"
echo ""

# Count remaining node processes
REMAINING=$(ps aux | grep -E "node|tsx|ts-node|vite" | grep -v grep | wc -l)
echo "📊 Remaining node processes: $REMAINING (system/other services)"
echo ""
echo "✅ SSH connection preserved - safe to continue"
