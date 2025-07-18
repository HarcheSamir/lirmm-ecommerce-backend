# ===== FILE: ./auth-service/Dockerfile (FINAL - VERIFIED) =====

# --- STAGE 1: Builder ---
# This stage builds dependencies and generates the Prisma client.
FROM node:18-alpine AS builder

# **THE FIX**: This environment variable tells Prisma to proceed
# even if it cannot download the checksum file, bypassing the 403 error.
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .

# --- STAGE 2: Production ---
# This stage creates the lean final image.
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY package*.json ./
COPY . .
EXPOSE 3001
CMD ["npm", "start"]