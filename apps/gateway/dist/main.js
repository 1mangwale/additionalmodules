"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
// Load local .env first, then fall back to monorepo root .env
dotenv.config();
if (!process.env.PG_HOST || !process.env.GATEWAY_PORT) {
    dotenv.config({ path: (0, path_1.resolve)(__dirname, '../../../.env') });
}
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const module_1 = require("./module");
const express = __importStar(require("express"));
const path_2 = require("path");
const http_proxy_middleware_1 = require("http-proxy-middleware");
async function bootstrap() {
    const app = await core_1.NestFactory.create(module_1.AppModule);
    app.enableCors({ origin: [/^http:\/\/localhost:(51\d{2}|5183|5184|\d+)$/, /^http:\/\/127\.0\.0\.1:(51\d{2}|5183|5184|\d+)$/], credentials: true });
    // Static hosting for built React apps under path prefixes (resolve relative to dist)
    const userDist = (0, path_1.resolve)(__dirname, '../../web-user/dist');
    const vendorDist = (0, path_1.resolve)(__dirname, '../../web-vendor/dist');
    app.use('/user', express.static(userDist));
    app.use('/vendor', express.static(vendorDist));
    // SPA fallback for client-side routes
    app.use('/user/*', (_req, res) => res.sendFile((0, path_2.join)(userDist, 'index.html')));
    app.use('/vendor/*', (_req, res) => res.sendFile((0, path_2.join)(vendorDist, 'index.html')));
    // Same-origin API proxies for the web apps
    const proxyCommon = { changeOrigin: true, xfwd: true, secure: false };
    // Support both /api/* and direct /* paths to match SPAs
    // Vendor-specific routes must be declared before generic service proxies
    // Rewrite '/services/vendor/*' -> '/vendor/*' targeting services-api (4002)
    app.use('/services/vendor', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: 'http://localhost:4002',
        pathRewrite: { '^/services/vendor': '/vendor' },
        ...proxyCommon,
    }));
    // Rewrite '/rooms/vendor/*' -> '/vendor/*' targeting rooms service (4001)
    app.use('/rooms/vendor', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: 'http://localhost:4001',
        pathRewrite: { '^/rooms/vendor': '/vendor' },
        ...proxyCommon,
    }));
    // Rewrite '/movies/vendor/*' -> '/vendor/*' targeting movies service (4005)
    app.use('/movies/vendor', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: 'http://localhost:4005',
        pathRewrite: { '^/movies/vendor': '/vendor' },
        ...proxyCommon,
    }));
    app.use('/api/rooms', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:4001', pathRewrite: { '^/api/rooms': '/rooms' }, ...proxyCommon }));
    app.use('/api/services', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:4002', pathRewrite: { '^/api/services': '/services' }, ...proxyCommon }));
    app.use('/api/pricing', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:4003', pathRewrite: { '^/api/pricing': '/pricing' }, ...proxyCommon }));
    app.use('/api/movies', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:4005', pathRewrite: { '^/api/movies': '/movies' }, ...proxyCommon }));
    // Movies (user + vendor)
    app.use('/movies', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:4005', ...proxyCommon }));
    app.use('/rooms', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:4001', ...proxyCommon }));
    app.use('/services', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:4002', ...proxyCommon }));
    app.use('/pricing', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:4003', ...proxyCommon }));
    // Search API (external service on port 3100)
    app.use('/search', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:3000', ...proxyCommon }));
    app.use('/gateway', (0, http_proxy_middleware_1.createProxyMiddleware)({ target: 'http://localhost:4000', pathRewrite: { '^/gateway': '' }, ...proxyCommon }));
    // Gateway health for frontends
    app.getHttpAdapter().getInstance().get('/api/gateway/health', (_req, res) => res.json({ ok: true }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Mangwale v2 Gateway')
        .setDescription('Gateway for Rooms, Services, Pricing')
        .setVersion('0.0.1')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    await app.listen(port);
    console.log(`Gateway running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map