#!/bin/bash

# Install missing dependencies
npm install @nestjs/typeorm typeorm reflect-metadata pg @nestjs/swagger swagger-ui-express class-validator class-transformer

# Build shared package
cd packages/shared
npm run build
cd ../..

# Try to start all services
npm run dev:all
