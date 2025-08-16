FROM localhost:5000/node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3010

CMD ["npm", "run", "start"]