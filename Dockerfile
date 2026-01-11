# DepUp Security Sandbox - Isolated Package Processing Environment
FROM node:18-alpine

# Install security tools and dependencies
RUN apk add --no-cache \
    clamav \
    clamav-daemon \
    freshclam \
    git \
    curl \
    wget \
    && freshclam --quiet

# Create non-root user for package processing
RUN addgroup -g 1001 -S depup && \
    adduser -u 1001 -S depup -G depup

# Set up working directory with proper permissions
WORKDIR /app
RUN chown depup:depup /app

# Copy package files and set permissions
COPY --chown=depup:depup package*.json ./
COPY --chown=depup:depup scripts/ ./scripts/

# Install dependencies as non-root user
USER depup
RUN npm ci --only=production

# Copy remaining source files
COPY --chown=depup:depup . .

# Create directories for processing
RUN mkdir -p /tmp/depup-processing && \
    chown depup:depup /tmp/depup-processing

# Set environment variables for security
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Default command
CMD ["node", "scripts/depup.mjs"]
