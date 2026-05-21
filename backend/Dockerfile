FROM node:22-alpine AS builder

WORKDIR /app

# OpenSSL is required by Prisma client
RUN apk update && apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN apk update && apk add --no-cache openssl

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Prisma migrate deploy needs the Prisma CLI at runtime
RUN npm install prisma@7.3.0 --omit=dev

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
