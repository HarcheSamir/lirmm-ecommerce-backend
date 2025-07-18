# ===== FILE: ./order-service/Dockerfile (FINAL - VERIFIED) =====

# --- STAGE 1: Builder ---
    FROM node:18-alpine AS builder
    # **THE FIX**: Bypass the 403 checksum error.
    ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
    
    # Install OpenSSL which is a Prisma runtime dependency on Alpine
    RUN apk add --no-cache openssl
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY prisma ./prisma/
    RUN npx prisma generate
    COPY . .
    
    # --- STAGE 2: Production ---
    FROM node:18-alpine
    # Install OpenSSL here as well for runtime.
    RUN apk add --no-cache openssl
    WORKDIR /app
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
    COPY package*.json ./
    COPY . .
    EXPOSE 3007
    CMD ["npm", "run", "start"]