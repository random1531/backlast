# Use official Node LTS
FROM node:18-bullseye-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies (copy package files first for caching)
COPY package*.json ./
RUN npm ci --only=production || npm install --production

# Copy app source
COPY . .

# Create data folder and set permissions for SQLite
RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app/data

# Use non-root user for security
USER node

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Start the app
CMD ["node", "./bin/www"]
