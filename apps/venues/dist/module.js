"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenuesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const entities_1 = require("./typeorm/entities");
const routes_venues_1 = require("./routes.venues");
const vendor_routes_1 = require("./vendor.routes");
const svc_venues_1 = require("./svc.venues");
function pgDataSource() {
    return typeorm_1.TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.PG_HOST || 'localhost',
        port: Number(process.env.PG_PORT || 5432),
        username: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASS || 'postgres',
        database: process.env.PG_DB || 'mangwale_booking',
        autoLoadEntities: true,
        synchronize: false,
    });
}
let VenuesModule = class VenuesModule {
};
exports.VenuesModule = VenuesModule;
exports.VenuesModule = VenuesModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule, pgDataSource(), typeorm_1.TypeOrmModule.forFeature([entities_1.VenueType, entities_1.VenueSlot, entities_1.VenueBooking])],
        controllers: [routes_venues_1.VenuesController, vendor_routes_1.VenuesVendorController],
        providers: [svc_venues_1.VenuesService],
    })
], VenuesModule);
//# sourceMappingURL=module.js.map