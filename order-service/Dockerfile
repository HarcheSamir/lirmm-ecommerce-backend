# ===== FILE: ./order-service/Dockerfile (REVISED) =====

# --- STAGE 1: Builder ---
    FROM node:18-alpine AS builder
    # Install OpenSSL which is a Prisma dependency on Alpine
    RUN apk add --no-cache openssl
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY prisma ./prisma/
    RUN npx prisma generate
    COPY . .
    
    # --- STAGE 2: Production ---
    FROM node:18-alpine
    # Install OpenSSL here as well for runtime
    RUN apk add --no-cache openssl
    WORKDIR /app
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
    COPY package*.json ./
    COPY . .
    
    EXPOSE 3007
    CMD ["npm", "run", "start"]