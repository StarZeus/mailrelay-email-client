FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_SKIP_TYPECHECK=1
# Add Placeholder values which will be replaced with env values during deployment time 
ENV NEXT_PUBLIC_ASSET_PREFIX=/__DYNAMIC_ASSET_PREFIX__
ENV NEXT_PUBLIC_BASE_PATH=/__DYNAMIC_BASE_PATH__

# Install build dependencies and tsx globally
RUN npm install -g pnpm tsx

# Build Next.js only
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install tsx globally in production
RUN npm install -g tsx

# Copy necessary files and directories
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/scripts/update-asset-prefix.sh ./scripts/update-asset-prefix.sh

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy additional files needed for migrations
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Set permissions for the nextjs user
RUN chown -R nextjs:nodejs .

USER nextjs

ENV PORT=3000
ENV SMTP_SERVER_PORT=2525
ENV APP_MODE=all



EXPOSE ${PORT}
EXPOSE ${SMTP_SERVER_PORT}

# Run migrations and start server
CMD npx drizzle-kit push --force && npm run start 