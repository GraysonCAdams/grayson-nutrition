FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS production
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/build ./build
COPY --from=build /app/loki-preload.mjs ./loki-preload.mjs
ENV NODE_OPTIONS="--import ./loki-preload.mjs"
EXPOSE 3000
CMD ["npm", "run", "start"]
