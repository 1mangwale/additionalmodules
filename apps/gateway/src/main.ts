import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
// Load local .env first, then fall back to monorepo root .env
dotenv.config();
if (!process.env.PG_HOST || !process.env.GATEWAY_PORT) {
  dotenv.config({ path: resolve(__dirname, '../../../.env') });
}

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './module';
import * as express from 'express';
import { join } from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: [/^http:\/\/localhost:(51\d{2}|5183|5184|\d+)$/, /^http:\/\/127\.0\.0\.1:(51\d{2}|5183|5184|\d+)$/], credentials: true });

  // Static hosting for built React apps under path prefixes (resolve relative to dist)
  const userDist = resolve(__dirname, '../../web-user/dist');
  const vendorDist = resolve(__dirname, '../../web-vendor/dist');
  app.use('/user', express.static(userDist));
  app.use('/vendor', express.static(vendorDist));
  // SPA fallback for client-side routes
  app.use('/user/*', (_req: express.Request, res: express.Response) => res.sendFile(join(userDist, 'index.html')));
  app.use('/vendor/*', (_req: express.Request, res: express.Response) => res.sendFile(join(vendorDist, 'index.html')));

  // Same-origin API proxies for the web apps
  const proxyCommon = { changeOrigin: true, xfwd: true, secure: false } as const;
  // Support both /api/* and direct /* paths to match SPAs
  // Vendor-specific routes must be declared before generic service proxies
  // Rewrite '/services/vendor/*' -> '/vendor/*' targeting services-api (4002)
  app.use('/services/vendor', createProxyMiddleware({
    target: 'http://localhost:4002',
    pathRewrite: { '^/services/vendor': '/vendor' },
    ...proxyCommon,
  }));
  // Rewrite '/rooms/vendor/*' -> '/vendor/*' targeting rooms service (4001)
  app.use('/rooms/vendor', createProxyMiddleware({
    target: 'http://localhost:4001',
    pathRewrite: { '^/rooms/vendor': '/vendor' },
    ...proxyCommon,
  }));
  // Rewrite '/movies/vendor/*' -> '/vendor/*' targeting movies service (4005)
  app.use('/movies/vendor', createProxyMiddleware({
    target: 'http://localhost:4005',
    pathRewrite: { '^/movies/vendor': '/vendor' },
    ...proxyCommon,
  }));
  // Rewrite '/venues/vendor/*' -> '/vendor/*' targeting venues service (4007)
  app.use('/venues/vendor', createProxyMiddleware({
    target: 'http://localhost:4007',
    pathRewrite: { '^/venues/vendor': '/vendor' },
    ...proxyCommon,
  }));
  // Rewrite '/restaurants/vendor/*' -> '/vendor/*' targeting restaurants service (4008)
  app.use('/restaurants/vendor', createProxyMiddleware({
    target: 'http://localhost:4008',
    pathRewrite: { '^/restaurants/vendor': '/vendor' },
    ...proxyCommon,
  }));
  app.use('/api/rooms', createProxyMiddleware({ target: 'http://localhost:4001', pathRewrite: { '^/api/rooms': '/rooms' }, ...proxyCommon }));
  app.use('/api/services', createProxyMiddleware({ target: 'http://localhost:4002', pathRewrite: { '^/api/services': '/services' }, ...proxyCommon }));
  app.use('/api/pricing', createProxyMiddleware({ target: 'http://localhost:4003', pathRewrite: { '^/api/pricing': '/pricing' }, ...proxyCommon }));
  app.use('/api/movies', createProxyMiddleware({ target: 'http://localhost:4005', pathRewrite: { '^/api/movies': '/movies' }, ...proxyCommon }));
  app.use('/api/venues', createProxyMiddleware({ target: 'http://localhost:4007', pathRewrite: { '^/api/venues': '/venues' }, ...proxyCommon }));
  app.use('/api/restaurants', createProxyMiddleware({ target: 'http://localhost:4008', pathRewrite: { '^/api/restaurants': '/restaurants' }, ...proxyCommon }));
  // Movies (user + vendor)
  app.use('/movies', createProxyMiddleware({ target: 'http://localhost:4005', ...proxyCommon }));
  app.use('/rooms', createProxyMiddleware({ target: 'http://localhost:4001', ...proxyCommon }));
  app.use('/services', createProxyMiddleware({ target: 'http://localhost:4002', ...proxyCommon }));
  app.use('/venues', createProxyMiddleware({ target: 'http://localhost:4007', ...proxyCommon }));
  app.use('/restaurants', createProxyMiddleware({ target: 'http://localhost:4008', ...proxyCommon }));
  app.use('/pricing', createProxyMiddleware({ target: 'http://localhost:4003', ...proxyCommon }));
  // Search API (external service on port 3100)
  app.use('/search', createProxyMiddleware({ target: 'http://localhost:3000', ...proxyCommon }));
  app.use('/gateway', createProxyMiddleware({ target: 'http://localhost:4000', pathRewrite: { '^/gateway': '' }, ...proxyCommon }));
  // Gateway health for frontends
  app.getHttpAdapter().getInstance().get('/api/gateway/health', (_req: any, res: any) => res.json({ ok: true }));
  const config = new DocumentBuilder()
    .setTitle('Mangwale v2 Gateway')
    .setDescription('Gateway for Rooms, Services, Pricing')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  console.log(`Gateway running on http://localhost:${port}`);
}
bootstrap();
