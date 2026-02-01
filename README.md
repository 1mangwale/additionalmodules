# Mangwale v2 – Rooms & Services (NestJS + Postgres) — **Starter Monorepo**

This repo scaffolds the new **Rooms** & **Services** modules in **NestJS + Postgres**, while keeping **wallet/payments** in your existing **PHP/MySQL v1**.
It includes a small **Finance Bridge** (HTTP client) that talks to v1's internal endpoints with **Idempotency-Key**.

> Open this folder in VS Code, run `npm i` at the root, and then `npm run dev:all` (after starting Postgres via Docker).

---

## Stack
- **Node 20 + NestJS** (per-service apps in `apps/*`)
- **TypeScript**, **TypeORM** (Postgres) for new domain data
- **NATS** (optional) for events, pre-wired client (can be disabled)
- **Axios** Finance Bridge → calls **v1 (PHP/MySQL)** internal endpoints
- **Swagger** enabled on each service at `/docs`

## Services (apps/*)
- `gateway` — lightweight API gateway + swagger root
- `rooms` — room types, inventory, bookings
- `services-api` — service catalog, slots, appointments
- `pricing` — dynamic slab evaluator (vendor-configurable)
- `bridge-finance` — calls v1 wallet/payments (hold/capture/use/refund, mirror orders)
- `shared` — DTOs/types used across services

> Each service runs independently on its own port for simplicity. You can introduce a proper API gateway later (Traefik/Kong/etc.).

## Quick start

1. **Copy envs**
   ```bash
   cp .env.example .env
   cp apps/rooms/.env.example apps/rooms/.env
   cp apps/services-api/.env.example apps/services-api/.env
   cp apps/pricing/.env.example apps/pricing/.env
   cp apps/bridge-finance/.env.example apps/bridge-finance/.env
   cp apps/gateway/.env.example apps/gateway/.env
   ```

2. **Start infra (Postgres + NATS)**  
   ```bash
   docker compose up -d
   ```

3. **Apply Postgres schema** (one-time)  
   ```bash
   # Requires psql available on your dev machine
   PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d mangwale_booking -f db/pg/sql/001_base_schema.sql
   ```

4. **Install & run**  
   ```bash
   npm i
   npm run dev:all
   ```

5. **Swagger**  
   - Gateway: http://localhost:4000/docs  
   - Rooms:   http://localhost:4001/docs  
   - Services: http://localhost:4002/docs  
   - Pricing: http://localhost:4003/docs  

---

## Env layout

- **Root `.env`** (shared): Postgres connection, NATS, v1 base URL/token.
- Per-app `.env` only overrides **PORT** and service-specific toggles.

See `.env.example` files for all keys.

---

## Finance Bridge (v1 PHP/MySQL)

This code **does not** move money itself. It calls your **existing v1** endpoints with **Idempotency-Key**:

- `POST /internal/wallet/hold`
- `POST /internal/wallet/capture`
- `POST /internal/wallet/use`
- `POST /internal/wallet/refund`
- `POST /internal/orders/mirror`
- `POST /internal/vendor/accrue`

These are stubbed in `apps/bridge-finance/src/finance.client.ts`. Point `V1_BASE_URL` and `V1_AUTH_TOKEN` to your v1.

---

## Migrations vs SQL

For speed, this starter ships **SQL** in `db/pg/sql/001_base_schema.sql`. You can convert to TypeORM migrations later.

---

## Notes

- All prices are in **minor units** wherever possible (DTOs); DB schema uses NUMERIC for readability during bootstrap.
- Timezone: **Asia/Kolkata** everywhere.
- Idempotency keys use pattern: `booking:<uuid>:action` or `job:<uuid>:action`.

---

Happy building! 🚀
