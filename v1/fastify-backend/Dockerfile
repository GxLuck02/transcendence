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

# Expose port
EXPOSE 8000

# Start the server
CMD ["node", "src/server.js"]
