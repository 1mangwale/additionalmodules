"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./typeorm/entities");
const routes_rooms_1 = require("./routes.rooms");
const vendor_routes_1 = require("./vendor.routes");
const svc_rooms_1 = require("./svc.rooms");
const axios_1 = require("@nestjs/axios");
function pgDataSource() {
    return typeorm_1.TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.PG_HOST,
        port: Number(process.env.PG_PORT || 5432),
        username: process.env.PG_USER,
        password: process.env.PG_PASS,
        database: process.env.PG_DB,
        autoLoadEntities: true,
        synchronize: false,
    });
}
let RoomsModule = class RoomsModule {
};
exports.RoomsModule = RoomsModule;
exports.RoomsModule = RoomsModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule, pgDataSource(), typeorm_1.TypeOrmModule.forFeature([entities_1.RoomType, entities_1.RoomRatePlan, entities_1.RoomInventory])],
        controllers: [routes_rooms_1.RoomsController, vendor_routes_1.RoomsVendorController],
        providers: [svc_rooms_1.RoomsService],
    })
], RoomsModule);
//# sourceMappingURL=module.js.map