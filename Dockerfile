FROM node:24-alpine

WORKDIR /app

COPY . .

RUN corepack enable
RUN pnpm install --frozen-lockfile

RUN pnpm build

EXPOSE 4000

CMD ["sh", "-c", "pnpm dotenv -e .env -- sh -c 'cd packages/corsair && pnpm corsair setup --plugin=gmail client_id=\"$GOOGLE_OAUTH_CLIENT_ID\" client_secret=\"$GOOGLE_OAUTH_CLIENT_SECRET\" && pnpm corsair setup --plugin=googlecalendar client_id=\"$GOOGLE_OAUTH_CLIENT_ID\" client_secret=\"$GOOGLE_OAUTH_CLIENT_SECRET\"' && pnpm --filter @repo/api start"]