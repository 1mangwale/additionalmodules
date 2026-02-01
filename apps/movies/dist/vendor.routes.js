"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoviesVendorController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("./typeorm/entities");
let MoviesVendorController = class MoviesVendorController {
    constructor(movies, screens, showtimes) {
        this.movies = movies;
        this.screens = screens;
        this.showtimes = showtimes;
    }
    listMovies() { return this.movies.find({ take: 200, order: { id: 'DESC' } }); }
    async createMovie(body) { const m = this.movies.create(body); return this.movies.save(m); }
    listScreens() { return this.screens.find({ take: 200, order: { id: 'DESC' } }); }
    async createScreen(body) { const s = this.screens.create(body); return this.screens.save(s); }
    listShowtimes() { return this.showtimes.find({ take: 200, order: { starts_at: 'ASC' } }); }
    async createShowtime(body) { const st = this.showtimes.create(body); return this.showtimes.save(st); }
    async deleteShowtime(id) { await this.showtimes.delete({ id: Number(id) }); return { ok: true }; }
};
exports.MoviesVendorController = MoviesVendorController;
__decorate([
    (0, common_1.Get)('/catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MoviesVendorController.prototype, "listMovies", null);
__decorate([
    (0, common_1.Post)('/catalog'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoviesVendorController.prototype, "createMovie", null);
__decorate([
    (0, common_1.Get)('/screens'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MoviesVendorController.prototype, "listScreens", null);
__decorate([
    (0, common_1.Post)('/screens'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoviesVendorController.prototype, "createScreen", null);
__decorate([
    (0, common_1.Get)('/showtimes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MoviesVendorController.prototype, "listShowtimes", null);
__decorate([
    (0, common_1.Post)('/showtimes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoviesVendorController.prototype, "createShowtime", null);
__decorate([
    (0, common_1.Delete)('/showtimes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MoviesVendorController.prototype, "deleteShowtime", null);
exports.MoviesVendorController = MoviesVendorController = __decorate([
    (0, common_1.Controller)('/vendor/movies'),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Movie)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Screen)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Showtime)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MoviesVendorController);
//# sourceMappingURL=vendor.routes.js.map