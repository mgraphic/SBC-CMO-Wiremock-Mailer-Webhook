FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# Install production dependencies only using lockfile for reproducible builds
COPY package*.json ./
RUN npm ci --omit=dev

COPY index.js .

# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/ || exit 1

CMD ["node", "index.js"]
