#!/bin/bash
set -e

# ==============================================================================
# OpenClaw Railway Template - Entrypoint Script
# Handles Railway PORT binding and graceful startup
# ==============================================================================

# Railway provides PORT environment variable
if [ -n "$PORT" ]; then
    echo "Railway environment detected"
    echo "Binding wrapper server to port $PORT"

    # Show available access points if private networking is available
    if [ -n "$RAILWAY_PRIVATE_DOMAIN" ]; then
        echo ""
        echo "Service accessible at:"
        echo "  - Public: via your Railway public domain"
        echo "  - Private: http://$RAILWAY_PRIVATE_DOMAIN:$PORT"
        echo ""
        echo "IMPORTANT: Always include :$PORT when connecting via private networking!"
        echo ""
    fi
else
    # Fallback for local development
    export PORT=8080
    echo "Local development mode"
    echo "Using default port $PORT"
fi

# Fix volume ownership (Railway mounts volumes as root)
# Only fix /data (the volume mount). /app and openclaw npm install are baked
# into the image with correct ownership — no need to chown them at runtime.
# Skip node_modules trees (thousands of files) to keep startup fast (<5s).
if [ "$(id -u)" = "0" ]; then
    find /data -not -path "*/node_modules/*" -exec chown openclaw:openclaw {} + 2>/dev/null || true
fi

# Ensure Playwright browser is accessible by openclaw user
if [ -d "/ms-playwright" ]; then
    chmod -R o+rx /ms-playwright 2>/dev/null || true
fi

# Ensure data directories exist with correct permissions
mkdir -p "$OPENCLAW_STATE_DIR" "$OPENCLAW_WORKSPACE_DIR" "$OPENCLAW_WORKSPACE_DIR/memory" "$OPENCLAW_STATE_DIR/workspace/memory"
chmod 700 "$OPENCLAW_STATE_DIR" "$OPENCLAW_WORKSPACE_DIR" 2>/dev/null || true

# Ensure npm global prefix directory exists for in-app upgrades
NPM_PREFIX="${NPM_CONFIG_PREFIX:-/data/.npm-global}"
NPM_MODULE_DIR="$NPM_PREFIX/lib/node_modules/openclaw"
NPM_ENTRY="$NPM_MODULE_DIR/dist/entry.js"
NPM_BIN_DIR="$NPM_PREFIX/bin"
NPM_BIN="$NPM_BIN_DIR/openclaw"
BAKED_MODULE_DIR="/usr/local/lib/node_modules/openclaw"
BAKED_ENTRY="$BAKED_MODULE_DIR/dist/entry.js"
SEED_MARKER="$NPM_PREFIX/.openclaw-seeded-version"

mkdir -p "$NPM_PREFIX"

# Fix ownership of newly created directories
if [ "$(id -u)" = "0" ]; then
    find /data -maxdepth 2 -not -path "*/node_modules/*" -exec chown openclaw:openclaw {} + 2>/dev/null || true
fi

# Seed the persistent npm prefix from the Docker-baked install on first boot.
# On redeploys, refresh the persistent install whenever the Docker-baked
# version is strictly NEWER than the version on the volume (upgrade-only).
# This makes "bump OPENCLAW_VERSION + redeploy" the canonical update path,
# even after a prior in-app upgrade. We never downgrade: if the volume copy
# is newer than the baked image (e.g. a user ran a newer in-app upgrade),
# it is treated as user-managed and left alone.
SEEDED_NPM_PREFIX="false"
BAKED_VERSION="$(node -e "try{const p=require(process.argv[1]);process.stdout.write(p.version||'')}catch{}" "$BAKED_MODULE_DIR/package.json")"
RUNTIME_VERSION=""
SEEDED_VERSION=""

seed_persistent_openclaw() {
    local temp_module_dir="$NPM_PREFIX/lib/node_modules/.openclaw-seed-$$"
    local temp_bin="$NPM_BIN_DIR/.openclaw-seed-bin-$$"
    local backup_module_dir="$NPM_PREFIX/lib/node_modules/.openclaw-backup-$$"
    local backup_bin="$NPM_BIN_DIR/.openclaw-backup-bin-$$"

    mkdir -p "$NPM_PREFIX/lib/node_modules" "$NPM_BIN_DIR"
    rm -rf "$temp_module_dir" "$backup_module_dir"
    rm -f "$temp_bin" "$backup_bin"

    if ! cp -a "$BAKED_MODULE_DIR" "$temp_module_dir"; then
        rm -rf "$temp_module_dir"
        rm -f "$temp_bin"
        return 1
    fi

    if ! cat > "$temp_bin" <<'EOF'
#!/bin/bash
PREFIX_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$PREFIX_DIR/lib/node_modules/openclaw/dist/entry.js" "$@"
EOF
    then
        rm -rf "$temp_module_dir"
        rm -f "$temp_bin"
        return 1
    fi

    if ! chmod +x "$temp_bin"; then
        rm -rf "$temp_module_dir"
        rm -f "$temp_bin"
        return 1
    fi

    if [ -e "$NPM_MODULE_DIR" ] && ! mv "$NPM_MODULE_DIR" "$backup_module_dir"; then
        rm -rf "$temp_module_dir"
        rm -f "$temp_bin"
        return 1
    fi

    if [ -e "$NPM_BIN" ] && ! mv "$NPM_BIN" "$backup_bin"; then
        if [ -e "$backup_module_dir" ]; then
            mv "$backup_module_dir" "$NPM_MODULE_DIR" || true
        fi
        rm -rf "$temp_module_dir"
        rm -f "$temp_bin"
        return 1
    fi

    if mv "$temp_module_dir" "$NPM_MODULE_DIR" && mv "$temp_bin" "$NPM_BIN"; then
        if ! printf '%s\n' "$BAKED_VERSION" > "$SEED_MARKER"; then
            echo "WARNING: Failed to write OpenClaw seed marker at $SEED_MARKER" >&2
        fi
        rm -rf "$backup_module_dir"
        rm -f "$backup_bin"
        return 0
    fi

    rm -rf "$NPM_MODULE_DIR"
    rm -f "$NPM_BIN"
    if [ -e "$backup_module_dir" ]; then
        mv "$backup_module_dir" "$NPM_MODULE_DIR" || true
    fi
    if [ -e "$backup_bin" ]; then
        mv "$backup_bin" "$NPM_BIN" || true
    fi
    rm -rf "$temp_module_dir"
    rm -f "$temp_bin"
    return 1
}

if [ -f "$NPM_MODULE_DIR/package.json" ]; then
    RUNTIME_VERSION="$(node -e "try{const p=require(process.argv[1]);process.stdout.write(p.version||'')}catch{}" "$NPM_MODULE_DIR/package.json")"
fi
if [ -f "$SEED_MARKER" ]; then
    SEEDED_VERSION="$(tr -d '\n' < "$SEED_MARKER")"
fi

# version_gt A B → success (0) when A is strictly newer than B.
# Uses `sort -V` so dot-separated CalVer (e.g. 2026.5.27 > 2026.5.20 > 2026.3.28)
# compares numerically rather than lexically.
version_gt() {
    [ -n "$1" ] && [ -n "$2" ] && [ "$1" != "$2" ] && \
        [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n1)" = "$1" ]
}

SEED_ACTION=""
if [ ! -f "$NPM_ENTRY" ] && [ -f "$BAKED_ENTRY" ]; then
    echo "Seeding persistent OpenClaw install into $NPM_PREFIX"
    SEED_ACTION="seed"
elif [ -f "$NPM_ENTRY" ] && version_gt "$BAKED_VERSION" "$RUNTIME_VERSION"; then
    echo "Upgrading persistent OpenClaw install ${RUNTIME_VERSION:-unknown} -> baked $BAKED_VERSION (baked is newer)"
    SEED_ACTION="refresh"
fi

if [ -n "$SEED_ACTION" ] && [ -f "$BAKED_ENTRY" ]; then
    if seed_persistent_openclaw; then
        SEEDED_NPM_PREFIX="true"
    else
        echo "WARNING: Failed to $SEED_ACTION persistent OpenClaw install; falling back to Docker-baked runtime" >&2
    fi
fi

if [ "$SEEDED_NPM_PREFIX" = "true" ] && [ "$(id -u)" = "0" ]; then
    chown -R openclaw:openclaw "$NPM_PREFIX" 2>/dev/null || true
fi

# Create symlinks from openclaw home into the persistent volume
# so $HOME/.openclaw resolves to /data/.openclaw and tool data persists
ln -sfn "$OPENCLAW_STATE_DIR" /home/openclaw/.openclaw
mkdir -p /data/.local /data/.npm
ln -sfn /data/.local /home/openclaw/.local
ln -sfn /data/.npm /home/openclaw/.npm
chown -h openclaw:openclaw /home/openclaw/.openclaw /home/openclaw/.local /home/openclaw/.npm
chown openclaw:openclaw /data/.local /data/.npm

# Keep externally-installed OpenClaw plugins (e.g. @openclaw/codex, @openclaw/discord)
# in lockstep with the core. Plugins live in a SEPARATE npm tree
# ($OPENCLAW_STATE_DIR/npm) that the core seed/refresh above does not touch, so a
# core upgrade can leave a stale plugin whose harness/provider contract no longer
# matches core (e.g. an old codex harness that rejects the openai-codex provider,
# surfacing as "Requested agent harness 'codex' does not support openai-codex/...").
# Reinstall any official @openclaw/* plugin whose version drifts from the running core.
sync_official_plugins() {
    local target="$1"
    [ -n "$target" ] || return 0

    local plug_root="$OPENCLAW_STATE_DIR/npm/node_modules/@openclaw"
    [ -d "$plug_root" ] || return 0

    local specs=""
    local d name pv
    for d in "$plug_root"/*/; do
        [ -f "${d}package.json" ] || continue
        name="$(basename "$d")"
        pv="$(node -e "try{process.stdout.write(require(process.argv[1]).version||'')}catch{}" "${d}package.json" 2>/dev/null || true)"
        if [ -n "$pv" ] && [ "$pv" != "$target" ]; then
            echo "OpenClaw plugin @openclaw/$name is $pv but core is $target; will resync"
            specs="$specs @openclaw/$name@$target"
        fi
    done

    [ -n "$specs" ] || return 0

    local cmd="/opt/openclaw-bin/openclaw"
    [ -x "$cmd" ] || cmd="openclaw"

    # `plugins install` takes ONE spec and needs --force to overwrite an existing plugin.
    echo "Resyncing OpenClaw plugins to core $target:$specs"
    local spec ok=1
    for spec in $specs; do
        if [ "$(id -u)" = "0" ]; then
            su -s /bin/bash openclaw -c "export HOME=/home/openclaw PATH=$NPM_BIN_DIR:/opt/openclaw-bin:\$PATH; timeout 300 $cmd plugins install --force '$spec'" \
                && echo "Resynced $spec" || { echo "WARNING: failed to resync $spec (non-fatal)" >&2; ok=0; }
        else
            ( export PATH="$NPM_BIN_DIR:/opt/openclaw-bin:$PATH"; timeout 300 "$cmd" plugins install --force "$spec" ) \
                && echo "Resynced $spec" || { echo "WARNING: failed to resync $spec (non-fatal)" >&2; ok=0; }
        fi
    done
    [ "$ok" = 1 ] && echo "OpenClaw plugin resync complete" || echo "OpenClaw plugin resync finished with warnings" >&2
    return 0
}

# Determine the core version that will actually run (post seed/refresh) and resync plugins.
EFFECTIVE_CORE_VERSION="$BAKED_VERSION"
if [ -f "$NPM_MODULE_DIR/package.json" ]; then
    EFFECTIVE_CORE_VERSION="$(node -e "try{process.stdout.write(require(process.argv[1]).version||'')}catch{}" "$NPM_MODULE_DIR/package.json" 2>/dev/null || true)"
    [ -n "$EFFECTIVE_CORE_VERSION" ] || EFFECTIVE_CORE_VERSION="$BAKED_VERSION"
fi
sync_official_plugins "$EFFECTIVE_CORE_VERSION" || true

# Sync pre-bundled skills into the skills directory
# Always overwrites bundled skill files to ensure Railway-aware instructions are current
# (e.g. replaces upstream SKILL.md that references localhost with our $SEARXNG_URL version)
SKILLS_DIR="$OPENCLAW_STATE_DIR/skills"
if [ -d "/bundled-skills" ]; then
    mkdir -p "$SKILLS_DIR"
    for skill_dir in /bundled-skills/*/; do
        skill_name=$(basename "$skill_dir")
        cp -r "$skill_dir" "$SKILLS_DIR/$skill_name"
        echo "Synced bundled skill: $skill_name"
    done
fi

# Log startup info
echo ""
echo "OpenClaw Railway Template"
echo "========================"
echo "State directory: $OPENCLAW_STATE_DIR"
echo "Workspace directory: $OPENCLAW_WORKSPACE_DIR"
echo "Internal gateway port: $INTERNAL_GATEWAY_PORT"
echo "External port: $PORT"
if [ -d "/ms-playwright" ] && [ -n "$(ls /ms-playwright 2>/dev/null)" ]; then
    echo "Browser: Chromium (Playwright) available"
else
    echo "Browser: Not available"
fi
echo ""

# Start the wrapper server (drop to openclaw user if running as root)
if [ "$(id -u)" = "0" ]; then
    exec su -s /bin/bash openclaw -c "exec node /app/src/server.js"
else
    exec node /app/src/server.js
fi
