# -------------------------------------------------------------------
# Stage 1: Base image
# -------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# -------------------------------------------------------------------
# Stage 2: Dependencies
# -------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# -------------------------------------------------------------------
# Stage 3: Builder (Compiles Next.js)
# -------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV MONGODB_URI="mongodb://127.0.0.1:27017/seatpulse"
ENV JWT_SECRET="build-phase-placeholder-secret-key"
ENV REDIS_URL="redis://127.0.0.1:6379"

# Run Next.js production build
RUN npm run build

# -------------------------------------------------------------------
# Stage 4: Production Runner
# -------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application and required assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/models ./models

USER nextjs

EXPOSE 3000

# Start custom Socket.io + BullMQ + Next.js server
CMD ["npm", "run", "start:custom"]
