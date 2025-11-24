FROM    base AS basebackend

RUN apk install -y --no-install-recommends \
    python3 \
    node \
    gcc \
    musl-dev \
    libc-dev \
    rm -rf /var/lib/apt/lists/*

# WORKDIR /app

# COPY package*.json ./

# RUN npm ci

# # Copy source code
# COPY src ./src

# # Create data directory for SQLite
# RUN mkdir -p /app/data

# # Expose port
# EXPOSE 8000

# # Start the server
# CMD ["node", "src/server.js"]
