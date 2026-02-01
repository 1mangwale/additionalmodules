"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./typeorm/entities");
const routes_services_1 = require("./routes.services");
const vendor_routes_1 = require("./vendor.routes");
const svc_services_1 = require("./svc.services");
const axios_1 = require("@nestjs/axios");
let ServicesModule = class ServicesModule {
};
exports.ServicesModule = ServicesModule;
exports.ServicesModule = ServicesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.PG_HOST,
                port: Number(process.env.PG_PORT || 5432),
                username: process.env.PG_USER,
                password: process.env.PG_PASS,
                database: process.env.PG_DB,
                autoLoadEntities: true,
                synchronize: false,
            }),
            typeorm_1.TypeOrmModule.forFeature([entities_1.ServiceCatalog, entities_1.ServiceSlot, entities_1.VendorStore, entities_1.ServiceAppointment])
        ],
        controllers: [routes_services_1.ServicesController, vendor_routes_1.ServicesVendorController],
        providers: [svc_services_1.ServicesService],
    })
], ServicesModule);
//# sourceMappingURL=module.js.map