FROM localhost:5000/node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

EXPOSE 3011

CMD ["npm", "start"]