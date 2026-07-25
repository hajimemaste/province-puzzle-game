# Single-service build: client is built to static assets and served by
# the Express server, so Railway only needs one service/domain.

FROM node:20-slim AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
# Empty string -> API calls resolve relative to whatever origin serves the
# app, which is correct once client + server share one Railway domain.
ENV VITE_API_URL=""
RUN npm run build

FROM node:20-slim AS server-build
WORKDIR /app/server
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=server-build /app/server ./
COPY --from=client-build /app/client/dist ./client-dist
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/index.js"]
