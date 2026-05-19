# ── Next.js dashboard — multi-stage build ────────────────────────────────────

# Stage 1: install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: build the app
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The rewrite proxy destination — overridden at build time via docker-compose
ARG API_URL=http://api:8000
ENV API_URL=$API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: lean production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# Copy only what next start needs
COPY --from=builder /app/public          ./public
COPY --from=builder /app/.next           ./.next
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/package.json    ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node_modules/.bin/next", "start"]
