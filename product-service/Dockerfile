# ===== FILE: ./product-service/Dockerfile (REVISED) =====

# --- STAGE 1: Builder ---
    FROM node:18-alpine AS builder
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY prisma ./prisma/
    RUN npx prisma generate
    COPY . .
    
    # --- STAGE 2: Production ---
    FROM node:18-alpine
    WORKDIR /app
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
    COPY package*.json ./
    COPY . .
    
    EXPOSE 3003
    CMD ["npm", "start"]