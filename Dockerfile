FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (instead of yarn.lock)
COPY package.json package-lock.json* ./

# Install dependencies using npm instead of yarn
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Start a new stage for a smaller final image
FROM node:20-alpine

WORKDIR /app

# Copy only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy built application from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "dist/src/index.js"]
