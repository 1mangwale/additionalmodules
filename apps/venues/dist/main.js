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
dotenv.config({ path: (0, path_1.resolve)(__dirname, '../../../.env') });
dotenv.config({ path: (0, path_1.resolve)(__dirname, '../.env') });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const module_1 = require("./module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(module_1.VenuesModule);
    app.enableCors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/], credentials: true });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Mangwale v2 Venues')
        .setDescription('Venues booking with smart slot generation')
        .setVersion('0.0.1')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT || 4007;
    await app.listen(port);
    console.log(`Venues running on http://localhost:${port}`);
    console.log(`Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map