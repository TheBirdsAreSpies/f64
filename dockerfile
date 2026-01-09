FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN bun run prisma:generate
RUN bun run build

FROM node:20-slim AS runtime

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/.output ./.output

# Set rights to upload directory
RUN chown -R node:node /app/.output

RUN mkdir -p /app/public/uploads && \
  mkdir -p /app/.output/public && \
  ln -sf /app/public/uploads /app/.output/public/uploads

RUN chown -R node:node /app/.output

COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/server ./server
COPY --from=build /app/lib ./lib
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV PORT=3000

# VOLUME ["/app/public/uploads"]

EXPOSE 3000

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER node

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
