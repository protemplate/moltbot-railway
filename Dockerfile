# OpenClaw Railway Template
# Optimized 2-stage build with npm install, optional features, and fast startup

# ==============================================================================
# Stage 1: Build the wrapper server (with node-pty native module)
# ==============================================================================
FROM node:24-bookworm-slim AS wrapper-builder

# Install build dependencies for node-pty
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files for wrapper server
COPY package.json ./
RUN npm install --omit=dev

# Copy wrapper server source
COPY src/ ./src/

# ==============================================================================
# Stage 2: Production runtime
# ==============================================================================
FROM node:24-bookworm-slim AS runtime

# Build args for version and optional features
ARG OPENCLAW_VERSION=2026.5.27
ARG INSTALL_SIGNAL_CLI=false
ARG INSTALL_BROWSER=true
ARG SIGNAL_CLI_VERSION=0.13.24

# Install base runtime dependencies
# - tini: proper PID 1 handling for signal forwarding
# - curl: health checks
# - ca-certificates: HTTPS requests
# - git, python3, make, g++: required for npm install -g (in-app upgrades)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    curl \
    ca-certificates \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw from npm (pre-built, ~30-60s instead of ~12min source build)
# Install to default /usr/local prefix BEFORE setting NPM_CONFIG_PREFIX to /data
# so it's baked into the image and not hidden by the Railway volume mount.
RUN npm install -g openclaw@${OPENCLAW_VERSION}

# Optional: Install Java + signal-cli for Signal channel support
# Set INSTALL_SIGNAL_CLI=true in Railway build args if needed
RUN if [ "$INSTALL_SIGNAL_CLI" = "true" ]; then \
      apt-get update && apt-get install -y --no-install-recommends \
        openjdk-17-jre-headless \
      && rm -rf /var/lib/apt/lists/* \
      && curl -L -o /tmp/signal-cli.tar.gz \
        "https://github.com/AsamK/signal-cli/releases/download/v${SIGNAL_CLI_VERSION}/signal-cli-${SIGNAL_CLI_VERSION}.tar.gz" \
      && tar xf /tmp/signal-cli.tar.gz -C /opt \
      && ln -sf /opt/signal-cli-${SIGNAL_CLI_VERSION}/bin/signal-cli /usr/local/bin/signal-cli \
      && rm /tmp/signal-cli.tar.gz; \
    else \
      echo "Skipping signal-cli (set INSTALL_SIGNAL_CLI=true to enable)"; \
    fi

# Create non-root user for security
RUN groupadd --system --gid 1001 openclaw && \
    useradd --system --uid 1001 --gid openclaw --shell /bin/bash --create-home openclaw

# Create openclaw CLI wrapper that ALWAYS runs first (PATH-priority via /opt/openclaw-bin).
# Injects OPENCLAW_GATEWAY_TOKEN so the CLI can authenticate with the gateway in ANY
# shell context (docker exec, Railway shell, web terminal, scripts).
# Delegates to the npm-upgraded version if available, otherwise the base npm install.
RUN mkdir -p /opt/openclaw-bin && \
    printf '#!/bin/bash\n\
if [ -z "$OPENCLAW_GATEWAY_TOKEN" ] && [ -f "${OPENCLAW_STATE_DIR:-/data/.openclaw}/gateway.token" ]; then\n\
  export OPENCLAW_GATEWAY_TOKEN=$(cat "${OPENCLAW_STATE_DIR:-/data/.openclaw}/gateway.token")\n\
fi\n\
if [ -z "$OPENCLAW_BUNDLED_SKILLS_DIR" ]; then\n\
  export OPENCLAW_BUNDLED_SKILLS_DIR="${OPENCLAW_STATE_DIR:-/data/.openclaw}/skills"\n\
fi\n\
NPM_ENTRY="${NPM_CONFIG_PREFIX:-/data/.npm-global}/lib/node_modules/openclaw/dist/entry.js"\n\
NPM_PACKAGE_JSON="${NPM_CONFIG_PREFIX:-/data/.npm-global}/lib/node_modules/openclaw/package.json"\n\
if [ -f "$NPM_ENTRY" ] && [ -f "$NPM_PACKAGE_JSON" ]; then\n\
  exec node "$NPM_ENTRY" "$@"\n\
fi\n\
exec node /usr/local/lib/node_modules/openclaw/dist/entry.js "$@"\n' > /opt/openclaw-bin/openclaw && \
    chmod +x /opt/openclaw-bin/openclaw

# Optional: Install Playwright Chromium for browser automation
# Matches the playwright-core version that OpenClaw depends on
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN if [ "$INSTALL_BROWSER" = "true" ]; then \
      PW_VER=$(node -e "try{console.log(require('/usr/local/lib/node_modules/openclaw/node_modules/playwright-core/package.json').version)}catch(e){console.log('latest')}" 2>/dev/null) && \
      echo "Installing playwright@${PW_VER} chromium..." && \
      npx -y playwright@${PW_VER} install --with-deps chromium && \
      chmod -R o+rx /ms-playwright && \
      CHROME_BIN=$(find /ms-playwright -name "chrome" -type f \( -path "*/chrome-linux/*" -o -path "*/chrome-linux64/*" \) 2>/dev/null | head -1) && \
      if [ -n "$CHROME_BIN" ]; then \
        ln -sf "$CHROME_BIN" /usr/local/bin/chromium && \
        echo "Symlinked $CHROME_BIN -> /usr/local/bin/chromium"; \
      else \
        echo "WARNING: Playwright chrome binary not found for symlink"; \
      fi; \
    else \
      echo "Skipping Playwright/Chromium (set INSTALL_BROWSER=true to enable)"; \
    fi

WORKDIR /app

# Copy wrapper server from builder
COPY --from=wrapper-builder /app/node_modules ./node_modules
COPY --from=wrapper-builder /app/src ./src
COPY --from=wrapper-builder /app/package.json ./package.json

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy pre-bundled skills (Railway-optimized)
COPY skills/ /bundled-skills/

# Create data directory with proper permissions
RUN mkdir -p /data/.openclaw /data/workspace && \
    chmod 700 /data/.openclaw /data/workspace && \
    chown -R openclaw:openclaw /data /app

# Note: No VOLUME directive — Railway manages volumes externally
# Note: Running as root because Railway volumes mount as root.
# The entrypoint handles dropping privileges after fixing permissions.

# Default port (Railway overrides via PORT env var)
EXPOSE 8080

# Environment defaults
# NPM_CONFIG_PREFIX on the persistent volume so in-app upgrades survive restarts.
# PATH order: /opt/openclaw-bin (token-injecting wrapper) > /data/.npm-global/bin
# (npm upgrades) > system defaults.  The wrapper delegates to the npm-upgraded
# entry.js when available, so the upgraded code still runs.
ENV NODE_ENV=production \
    HOME=/home/openclaw \
    OPENCLAW_STATE_DIR=/data/.openclaw \
    OPENCLAW_WORKSPACE_DIR=/data/workspace \
    INTERNAL_GATEWAY_PORT=18789 \
    NPM_CONFIG_PREFIX=/data/.npm-global \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PATH=/opt/openclaw-bin:/data/.npm-global/bin:$PATH

# Health check - checks wrapper server health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Use tini as init system for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--", "/entrypoint.sh"]
