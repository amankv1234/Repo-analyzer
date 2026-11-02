# --- Multi-stage Production Dockerfile: BullMQ Worker ---
FROM node:22-alpine AS base
RUN apk add --no-cache git
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Stage 1: Dependency installation
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/core/package.json packages/core/
COPY packages/prompts/package.json packages/prompts/
COPY apps/worker/package.json apps/worker/
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Compilation
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/worker/ apps/worker/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/prompts/node_modules ./packages/prompts/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
RUN pnpm --filter @repomentor/worker build

# Stage 3: Minimal non-root runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install git for shallow cloning
RUN apk add --no-cache git
RUN addgroup -g 1001 -S nodejs && adduser -S repomentor -u 1001

COPY --from=build --chown=repomentor:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=repomentor:nodejs /app/packages ./packages
COPY --from=build --chown=repomentor:nodejs /app/apps/worker ./apps/worker

USER repomentor

CMD ["node", "apps/worker/dist/index.js"]
