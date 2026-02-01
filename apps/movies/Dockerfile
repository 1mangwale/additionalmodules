FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/movies ./apps/movies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mangwale/movies build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/movies ./apps/movies
RUN pnpm install --frozen-lockfile --prod
EXPOSE 4005
CMD ["node", "apps/movies/dist/main.js"]
