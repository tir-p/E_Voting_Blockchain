# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy blockchain package files
COPY blockchain/package*.json ./blockchain/

# Install dependencies for both root and blockchain
RUN npm install
RUN cd blockchain && npm install

# Copy all source files
COPY . .

# Build the Next.js app
RUN npm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy package files from root
COPY package*.json ./

# Copy blockchain package files
COPY blockchain/package*.json ./blockchain/

# Install production dependencies only
RUN npm install --production
RUN cd blockchain && npm install --production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/blockchain/artifacts ./blockchain/artifacts
COPY --from=builder /app/blockchain/cache ./blockchain/cache

# Copy remaining source files needed at runtime
COPY lib ./lib
COPY data ./data
COPY contracts ./contracts
COPY app ./app
COPY next.config.mjs ./
COPY jsconfig.json ./
COPY blockchain/hardhat.config.js ./blockchain/

# Expose the Next.js port
EXPOSE 3000

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start the Next.js app
CMD ["npm", "start"]
