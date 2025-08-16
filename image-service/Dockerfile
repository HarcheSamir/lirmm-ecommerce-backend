FROM localhost:5000/node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install 

COPY . .

RUN mkdir -p /app/uploads

EXPOSE 3004 

CMD ["npm", "start"]