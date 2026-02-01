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
exports.MoviesController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("./typeorm/entities");
let MoviesController = class MoviesController {
    constructor(movies, screens, showtimes) {
        this.movies = movies;
        this.screens = screens;
        this.showtimes = showtimes;
    }
    async catalog(q) {
        const where = {};
        if (q.store_id)
            where.store_id = Number(q.store_id);
        const items = await this.movies.find({ where, take: 200, order: { id: 'DESC' } });
        return { items, total: items.length };
    }
    async listShowtimes(q) {
        const where = {};
        if (q.store_id)
            where.store_id = Number(q.store_id);
        if (q.movie_id)
            where.movie_id = Number(q.movie_id);
        const items = await this.showtimes.find({ where, take: 200, order: { starts_at: 'ASC' } });
        return { items, total: items.length };
    }
    async detail(id) {
        const m = await this.movies.findOne({ where: { id: Number(id) } });
        return m;
    }
};
exports.MoviesController = MoviesController;
__decorate([
    (0, common_1.Get)('/catalog'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)('/showtimes'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "listShowtimes", null);
__decorate([
    (0, common_1.Get)('/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "detail", null);
exports.MoviesController = MoviesController = __decorate([
    (0, common_1.Controller)('/movies'),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Movie)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Screen)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Showtime)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MoviesController);
//# sourceMappingURL=routes.movies.js.map