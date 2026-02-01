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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Showtime = exports.Screen = exports.Movie = void 0;
const typeorm_1 = require("typeorm");
let Movie = class Movie {
};
exports.Movie = Movie;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Movie.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Movie.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Movie.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Movie.prototype, "genre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 120 }),
    __metadata("design:type", Number)
], Movie.prototype, "duration_min", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 1 }),
    __metadata("design:type", Number)
], Movie.prototype, "status", void 0);
exports.Movie = Movie = __decorate([
    (0, typeorm_1.Entity)({ name: 'movies' })
], Movie);
let Screen = class Screen {
};
exports.Screen = Screen;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Screen.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Screen.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Screen.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 100 }),
    __metadata("design:type", Number)
], Screen.prototype, "seat_count", void 0);
exports.Screen = Screen = __decorate([
    (0, typeorm_1.Entity)({ name: 'screens' })
], Screen);
let Showtime = class Showtime {
};
exports.Showtime = Showtime;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Showtime.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Showtime.prototype, "store_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Showtime.prototype, "movie_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Showtime.prototype, "screen_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Showtime.prototype, "starts_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Showtime.prototype, "booked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Showtime.prototype, "base_price", void 0);
exports.Showtime = Showtime = __decorate([
    (0, typeorm_1.Entity)({ name: 'showtimes' })
], Showtime);
//# sourceMappingURL=entities.js.map