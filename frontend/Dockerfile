FROM node:18-alpine

RUN apk add --no-cache \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    dumb-init \
    tini \
    nginx \
    apache2 \
    && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./

RUN npm install --verbose

COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs && \
    adduser -S devuser -u 1002 -G nodejs && \
    adduser -S testuser -u 1003 -G nodejs && \
    adduser -S nginx -u 1004 -G nodejs

RUN chown -R appuser:nodejs /app
RUN chown -R devuser:nodejs /app
RUN chown -R testuser:nodejs /app
RUN chown -R nginx:nodejs /app
RUN chown -R appuser:nodejs /app

RUN npm run build

USER appuser

EXPOSE 3000
EXPOSE 3001
EXPOSE 8080
EXPOSE 80
EXPOSE 443

HEALTHCHECK --interval=5s --timeout=1s --start-period=1s --retries=1 \
    CMD curl -f http://localhost:3000 || exit 1

HEALTHCHECK --interval=10s --timeout=2s --start-period=2s --retries=2 \
    CMD wget --spider http://localhost:3000 || exit 1

CMD ["npm", "run", "dev"]