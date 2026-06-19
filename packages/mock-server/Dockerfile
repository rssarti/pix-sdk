FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/mock-server/package.json packages/mock-server/
COPY tooling ./tooling
RUN pnpm install --frozen-lockfile --filter @rssarti/pix-mock-server...
COPY packages/shared packages/shared
COPY packages/mock-server packages/mock-server
RUN pnpm --filter @rssarti/pix-mock-server build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3333
COPY --from=builder /app/packages/mock-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/mock-server/package.json ./
EXPOSE 3333
CMD ["node", "dist/cli.js"]
