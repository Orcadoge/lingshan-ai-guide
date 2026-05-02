FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/planner/package.json packages/planner/package.json
COPY packages/data/package.json packages/data/package.json
COPY packages/prompts/package.json packages/prompts/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm --filter @handan/shared build \
  && pnpm --filter @handan/ui build \
  && pnpm --filter web build

EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
