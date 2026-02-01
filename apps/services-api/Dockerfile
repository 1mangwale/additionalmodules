FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/services-api ./apps/services-api
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mangwale/services-api build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/services-api ./apps/services-api
RUN pnpm install --frozen-lockfile --prod
EXPOSE 4002
CMD ["node", "apps/services-api/dist/main.js"]
