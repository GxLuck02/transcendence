FROM node:20-alpine

# Install build dependencies for better-sqlite3 and sodium-native
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    musl-dev \
    linux-headers \
    libc-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (not --production because better-sqlite3 needs build tools)
RUN npm ci

# Copy source code
COPY src ./src

# Create data directory for SQLite
RUN mkdir -p /app/data

# SECURITY: Create non-root user and set ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Start the server
CMD ["node", "src/server.js"]
