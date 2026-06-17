FROM node:24-alpine

WORKDIR /app

COPY . .

RUN corepack enable
RUN pnpm install --no-frozen-lockfile

RUN pnpm build

EXPOSE 4000

CMD ["pnpm", "--filter", "@repo/api", "start"]