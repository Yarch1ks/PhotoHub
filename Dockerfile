# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev for prepare script
RUN npm ci --legacy-peer-deps --include=optional

# Copy source code
COPY . .

# Build the application with standalone output
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Set environment variables to fix issues
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DISABLE_V8_COMPILE_CACHE=1

# Start the application
CMD ["node", "server.js"]