"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoviesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./typeorm/entities");
const routes_movies_1 = require("./routes.movies");
const vendor_routes_1 = require("./vendor.routes");
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
let MoviesModule = class MoviesModule {
};
exports.MoviesModule = MoviesModule;
exports.MoviesModule = MoviesModule = __decorate([
    (0, common_1.Module)({
        imports: [pgDataSource(), typeorm_1.TypeOrmModule.forFeature([entities_1.Movie, entities_1.Screen, entities_1.Showtime])],
        controllers: [routes_movies_1.MoviesController, vendor_routes_1.MoviesVendorController],
        providers: [],
    })
], MoviesModule);
//# sourceMappingURL=module.js.map