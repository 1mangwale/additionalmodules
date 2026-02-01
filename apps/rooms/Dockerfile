FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/rooms ./apps/rooms
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mangwale/rooms build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/rooms ./apps/rooms
RUN pnpm install --frozen-lockfile --prod
EXPOSE 4001
CMD ["node", "apps/rooms/dist/main.js"]
