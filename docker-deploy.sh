#!/bin/bash

set -e

echo "======================================"
echo "🐳 Mangwale Docker Deployment"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create network if it doesn't exist
if ! docker network inspect mwv2-network > /dev/null 2>&1; then
    echo "📡 Creating Docker network..."
    docker network create mwv2-network
fi

# Connect existing postgres to network if not already connected
if docker ps --filter "name=mwv2-postgres" --format "{{.Names}}" | grep -q mwv2-postgres; then
    echo "🔗 Connecting existing Postgres to network..."
    docker network connect mwv2-network mwv2-postgres 2>/dev/null || echo "  Already connected"
else
    echo "⚠️  Warning: mwv2-postgres container not found. Make sure database is running."
fi

# Stop and remove old containers
echo ""
echo "🛑 Stopping old containers..."
docker-compose -f docker-compose.services.yml down 2>/dev/null || true

# Build and start services
echo ""
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.services.yml build

echo ""
echo "🚀 Starting all services..."
docker-compose -f docker-compose.services.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"
echo ""
echo "📋 Running Services:"
docker-compose -f docker-compose.services.yml ps
echo ""
echo "🌐 Access Points:"
echo "   Gateway:      http://localhost:4000"
echo "   Services API: http://localhost:4002/docs"
echo "   Venues API:   http://localhost:4007/docs"
echo "   Rooms API:    http://localhost:4001/docs"
echo "   Movies API:   http://localhost:4005/docs"
echo "   User Web:     http://localhost:5173"
echo "   Vendor Web:   http://localhost:5174"
echo ""
echo "📊 View logs:"
echo "   docker-compose -f docker-compose.services.yml logs -f [service-name]"
echo ""
echo "🛑 Stop all:"
echo "   docker-compose -f docker-compose.services.yml down"
echo ""
echo "======================================"
