# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies for building
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy database source and tsconfig for migrations (running via ts-node in prod)
COPY src ./src 
COPY tsconfig.json ./

# Expose port
EXPOSE 3001

# Run migrations using pre-compiled JS and then start the application
CMD ["sh", "-c", "npm run migration:run:prod && node dist/src/main"]
