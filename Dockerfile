# DepUp Security Sandbox - Isolated Package Processing Environment
FROM node:24-alpine

# Install security tools and dependencies
RUN apk add --no-cache \
    clamav \
    clamav-daemon \
    freshclam \
    git \
    curl \
    wget \
    && freshclam --quiet || echo "Warning: ClamAV database update failed - continuing without latest definitions"

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
RUN npm ci --omit=dev

# Copy remaining source files (filtered by .dockerignore)
COPY --chown=depup:depup . .

# Create directories for processing and npm cache (needed for --read-only)
RUN mkdir -p /tmp/depup-processing /tmp/npm-cache && \
    chown depup:depup /tmp/depup-processing /tmp/npm-cache

# Set environment variables for security
ENV NODE_ENV=production
ENV NPM_CONFIG_CACHE=/tmp/npm-cache
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# Create .npmrc for npm publish auth (NODE_AUTH_TOKEN set at runtime via -e flag)
RUN echo '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}' > ~/.npmrc

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Entrypoint receives package name and flags as arguments
ENTRYPOINT ["node", "scripts/depup.mjs"]
