FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY frontend/package.json frontend/package.json
RUN npm install --omit=dev --workspace frontend

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/package.json ./frontend/package.json
COPY frontend ./frontend
ARG API_PROXY_TARGET=http://backend:4000
ENV API_PROXY_TARGET=$API_PROXY_TARGET
ENV NODE_ENV=production
RUN cd frontend && npx next build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public
EXPOSE 3000
CMD ["node", "server.js"]
