FROM node:18-alpine

WORKDIR /app

# Copy only package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --only=production # Install only production deps for smaller image

# Copy the rest of the application code
COPY . .

# Application Port
EXPOSE 3005

# Start command
CMD ["npm", "start"]