# ===== FILE: ./auth-service/Dockerfile (REVISED) =====

# --- STAGE 1: Builder ---
# This stage installs all dependencies, including devDependencies,
# and generates the Prisma client.
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm install

# Copy the Prisma schema
COPY prisma ./prisma/

# Generate the Prisma Client
RUN npx prisma generate

# Copy the rest of the source code
COPY . .


# --- STAGE 2: Production ---
# This stage creates the lean final image. It copies only the necessary
# production code and modules from the 'builder' stage.
FROM node:18-alpine

WORKDIR /app

# Copy production node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the generated Prisma client from the builder stage
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Copy package files
COPY package*.json ./

# Copy compiled source code and other assets
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# The command to run the application
CMD ["npm", "start"]