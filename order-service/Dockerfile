# ===== FILE: order-service/Dockerfile =====
FROM localhost:5000/node:18-alpine

# Install system dependencies required by Prisma's binary engine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3007

CMD ["npm", "run", "start"]