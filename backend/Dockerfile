FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
COPY backend/package.json backend/package.json
RUN npm install --omit=dev --workspace backend

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/backend/package.json ./backend/package.json
COPY backend ./backend
EXPOSE 4000
CMD ["node", "backend/server.js"]
