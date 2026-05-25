# OpenClaw Railway Template

Deploy [OpenClaw](https://github.com/openclaw/openclaw), a personal AI assistant for messaging platforms, to [Railway](https://railway.app) with one click.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/openclaw-all-in-one-bundle)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

## Features

### Deployment

- **One-click Railway deploy** with auto-generated secrets
- **Multi-stage Docker build** — OpenClaw built from source with optimized runtime image
- **Persistent storage** via Railway volumes at `/data`

### Management Dashboard (`/lite`)

Full-featured web panel for day-to-day operations:

- Gateway control (start / stop / restart) with uptime tracking
- Daily token usage chart — 7-day rolling breakdown by output, input, cache write, cache read with estimated cost
- Session monitoring via gateway RPC
- Memory and knowledge base — full-text search, re-index, status
- Activity log — real-time log streaming with pattern-based highlighting
- Scheduled tasks (cron) viewer
- Security audit — standard and deep modes
- Version management with in-app upgrades (no redeploy required)
- Backup and restore (`.tar.gz` / `.zip`, auto-backup before restore, rollback on failure)
- Device pairing approval
- Web terminal — interactive bash shell via xterm.js

### Setup Wizard (`/onboard`)

Interactive 5-step onboarding:

1. Welcome and overview
2. AI provider selection (14 providers)
3. Channel configuration (17 platforms)
4. Skill installation (ClawHub + Build with Claude marketplace)
5. Review and deploy

Includes a terminal mode for advanced users who prefer the full CLI experience.

### AI Providers (14)

| Provider | Description |
|----------|-------------|
| **Anthropic** | Claude Opus, Sonnet, Haiku |
| **OpenAI** | GPT-4o, o1, o3, DALL-E — API key or ChatGPT/Codex subscription pairing |
| **Google / Gemini** | Gemini Pro, Flash, Ultra |
| **OpenRouter** | Multi-provider gateway |
| **MiniMax** | MiniMax M2.1 models |
| **Venice AI** | Privacy-focused AI inference |
| **Together AI** | Open-source model hosting |
| **Vercel AI Gateway** | Edge AI inference gateway |
| **Moonshot AI** | Kimi large language models |
| **Kimi Coding** | AI-powered code assistant |
| **Z.AI (GLM)** | Zhipu GLM series models |
| **Cloudflare AI Gateway** | Edge AI inference gateway |
| **OpenCode Zen** | Claude, GPT and more via Zen |
| **Ollama** | Run models locally (no key needed) |

### Messaging Channels (17)

| Channel | Channel | Channel |
|---------|---------|---------|
| Telegram | Discord | Slack |
| WhatsApp | Signal | Matrix |
| Mattermost | Google Chat | Nextcloud Talk |
| Zalo | LINE | Twitch |
| IRC | Nostr | MS Teams |
| Tlon | Feishu / Lark | |

### Security

- Password-protected management endpoints (`SETUP_PASSWORD`)
- Non-root container (`openclaw:openclaw`, UID 1001)
- tini as PID 1 for proper signal handling
- Gateway bound to loopback only — wrapper handles all external traffic
- Cookie-based auth with httpOnly, sameSite=strict, secure in production
- Proxy strips forwarded headers on WebSocket upgrades

### Operations

- **In-app upgrades** — update OpenClaw via npm without redeploying the container
- **Shared runtime install** — first boot seeds OpenClaw into `/data/.npm-global` so both `/openclaw` and `/lite` use the same persistent npm-managed copy
- **Backup and restore** — download/upload configuration snapshots
- **Auto-restart on crash** with 5-second delay
- **Graceful shutdown** via SIGTERM with 10-second kill timeout
- **Health checks** — liveness, readiness, and Kubernetes-style probes

### Browser Automation

Built-in Playwright with Chromium pre-installed for browser-based tools and automation.

### Pre-bundled Skills

- **SearXNG search** — auto-enabled when `SEARXNG_URL` is set (see [OpenClaw + SearXNG template](https://railway.com/deploy/jOiw-W))

### Using Plano as an LLM Gateway

[Plano](https://github.com/katanemo/plano) is an AI-native proxy that sits in front of LLM providers and adds routing, rate limiting, and cost controls. You can deploy OpenClaw alongside Plano using the [OpenClaw + Plano template](https://railway.com/deploy/plano-ai).

**Important:** OpenClaw does **not** use the `OPENAI_BASE_URL` environment variable. It has its own provider system that connects directly to configured API endpoints. To route OpenClaw traffic through Plano, you must configure a **custom provider** pointing to Plano's internal URL.

#### Setup

During onboard, select the **"Custom / OpenAI-compatible"** provider and configure:

| Field | Value |
|-------|-------|
| **API Base URL** | `http://plano.railway.internal:12000/v1` |
| **API Key** | Your actual LLM provider API key (Plano passes it through) |
| **Model ID** | Must use litellm `provider/model` format (e.g., `openai/gpt-4o`, `anthropic/claude-sonnet-4-5`) |
| **Context Window** | Set to match your model (e.g., `128000` for GPT-4o, `200000` for Claude) |

This writes the following config structure in `openclaw.json`:

```json
{
  "models": {
    "providers": {
      "my-plano": {
        "baseUrl": "http://plano.railway.internal:12000/v1",
        "api": "openai-completions",
        "apiKey": "sk-...",
        "models": [
          {
            "id": "openai/gpt-4o",
            "contextWindow": 128000,
            "maxTokens": 4096
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "my-plano/openai/gpt-4o"
      }
    }
  }
}
```

Plano uses [litellm model naming](https://docs.planoai.dev/concepts/llm_providers/supported_providers.html) — the model ID must include the provider prefix (e.g., `openai/gpt-4o`, `anthropic/claude-sonnet-4-5`, `groq/llama-4-maverick-17b-128e-instruct`). OpenClaw sends this ID as-is in the API request's `model` field.

#### Common pitfalls

- **Model name mismatch** — The model ID must use Plano's `provider/model` format (e.g., `openai/gpt-4o`, not just `gpt-4o`). If the format is wrong, Plano returns HTTP 400 and OpenClaw retries in a loop, flooding logs.
- **Context window too small** — If context window is unset or below 16,000 tokens, OpenClaw refuses to use the model. The wrapper auto-sets it to 200,000 if it detects a value below 32,000, but you can override this in the config editor or during onboard.
- **Plano idles without traffic** — Railway idles internal-only services (no public domain) after ~15 minutes of inactivity. If OpenClaw is also idle, Plano may take a few seconds to wake up on the next request.
- **PORT must be set on Plano** — Services without a public domain don't get a `PORT` env var automatically. The Plano template sets `PORT=12000` explicitly; do not remove it.

### Internationalization

Management dashboard and setup wizard available in 5 languages: English, Traditional Chinese, Simplified Chinese, Japanese, Korean. Auto-detected from browser with manual override.

## Quick Start

1. Click the **Deploy on Railway** button above
2. Set your `SETUP_PASSWORD` (or let Railway auto-generate one)
3. Add a volume mounted at `/data` for persistent storage
4. Deploy and wait for the service to start
5. Visit `https://your-app.railway.app/onboard` and enter your password
6. Choose your AI provider, configure channels, and start the gateway

## Management Dashboard

Access the dashboard at `/lite` with your setup password.

### Status and Gateway Control

The dashboard shows gateway status (running/stopped) with uptime. Use the quick action buttons to start, stop, or restart the gateway.

### Token Usage Analytics

A 7-day rolling chart breaks down token usage by category (output, input, cache write, cache read) with estimated cost per day. Data is fetched via gateway RPC with CLI fallback.

### Session Monitoring

View active sessions with details pulled from the gateway's session list.

### Memory and Knowledge Base

- View memory status: backend type, indexed entries, total files
- Full-text search across all memory files
- Trigger re-indexing from the dashboard

### Activity Log

Real-time log streaming with auto-scroll and pattern-based highlighting for events like:
- Gateway started/stopped
- Messages received/sent
- Channel connected/disconnected
- Errors detected
- Devices paired
- Skills loaded
- Sessions created
- Scheduled tasks executed
- Memory updated

### Scheduled Tasks

View configured cron jobs from the gateway with their schedules and status.

### Security Audit

Run audits in two modes:
- **Standard** — quick check of common security settings
- **Deep** — thorough analysis including configuration review

Results are categorized as pass, warn, or fail.

### Version Management and Upgrades

- Check current version against the latest on npm
- Upgrade in-app without redeploying the container
- Auto-backup before upgrade for safety

### Backup and Restore

- **Download** a `.tar.gz` backup of the entire state directory
- **Restore** from `.tar.gz` or `.zip` uploads
- Auto-backup before restore with automatic rollback on extraction failure
- Gateway is stopped during restore and restarted after

### Web Terminal

Full interactive bash shell via xterm.js at `/lite/ws`. Includes a command palette with 30+ CLI commands and descriptions.

## Setup Wizard

Access at `/onboard` with your setup password.

### Two Modes

- **Simple mode** — 5-step form wizard for guided setup
- **Terminal mode** — full xterm.js terminal running `openclaw onboard` for advanced users

### AI Provider Configuration

Select from 14 providers. Popular providers (Anthropic, OpenAI, Google/Gemini, OpenRouter) are shown first. Enter your API key and the wizard writes the configuration directly.

#### ChatGPT / Codex Subscription Pairing

If you have a ChatGPT/Codex subscription, you can connect it without an API key — straight from the browser, even on a headless Railway container. Pick **OpenAI Codex (subscription)** as your provider and the wizard runs OpenAI's device-code flow for you:

1. Click **Open auth page** and sign in with your ChatGPT/Codex subscription.
2. Enter the one-time code the wizard shows you (expires in 15 minutes).
3. Keep the tab open — it polls for approval and finishes automatically.

![ChatGPT / Codex subscription pairing in the onboarding wizard](https://somi-public-assets.s3.ap-southeast-1.amazonaws.com/railway/openclaw-onboard-openai-sub.jpg)

Once you approve, the wizard applies the channels and skills you picked in earlier steps, fixes the model prefix (`openai-codex/...`), and restarts the gateway — no re-prompting and no terminal output to copy. When it's done you get **Open Lite Panel** and **Open OpenClaw Gateway Dashboard** buttons.

![Codex pairing finished — channels configured and gateway restarted](https://somi-public-assets.s3.ap-southeast-1.amazonaws.com/railway/openclaw-onboard-openai-sub-finish.png)

### Channel Configuration

Toggle and configure any of the 17 messaging channels. Each channel shows only the fields it needs:

- **Telegram** — bot token
- **Discord** — bot token
- **Slack** — bot token + app token
- **WhatsApp** — link phone post-deploy
- **Signal** — link phone post-deploy via signal-cli
- **IRC** — host, port, nick, channels
- **Matrix** — homeserver, access token
- **MS Teams** — app ID, app password, tenant ID
- And more...

### Skill Installation

Install skills from two sources:
- **ClawHub** — community skill marketplace (`npx clawhub install`)
- **Build with Claude** — AI-built skills from `buildwithclaude.com`

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SETUP_PASSWORD` | Password for `/onboard` and `/lite` | — | **Yes** |
| `OPENCLAW_STATE_DIR` | Configuration and state directory | `/data/.openclaw` | No |
| `OPENCLAW_WORKSPACE_DIR` | File storage directory | `/data/workspace` | No |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway auth token (auto-generated if not set) | Auto-generated | No |
| `INTERNAL_GATEWAY_PORT` | Internal port for OpenClaw gateway | `18789` | No |
| `PORT` | External port (Railway overrides this) | `8080` | No |
| `SEARXNG_URL` | SearXNG instance URL (enables search skill) | — | No |

### Railway Volume Setup

**Required for data persistence:**

1. Go to your OpenClaw service in Railway
2. Navigate to the **Volumes** tab
3. Click **Add Volume**
4. Set the mount path to `/data`
5. Redeploy the service

Without a volume, all configuration and data will be lost on redeploy.

### Example: Telegram Bot

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4"
      }
    }
  },
  "auth": {
    "anthropic": {
      "provider": "anthropic",
      "apiKey": "sk-ant-..."
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "123456:ABC..."
    }
  }
}
```

### Example: Discord Bot

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-4o"
      }
    }
  },
  "auth": {
    "openai": {
      "provider": "openai",
      "apiKey": "sk-..."
    }
  },
  "channels": {
    "discord": {
      "enabled": true,
      "token": "MTI..."
    }
  }
}
```

## Architecture

### Project Structure

```
openclaw-railway/
├── Dockerfile                # Multi-stage build (3 stages)
├── Dockerfile.local          # Local dev build with mock CLI
├── docker-compose.yml        # Local development
├── entrypoint.sh             # Volume permissions + privilege drop
├── Makefile                  # Development commands
├── railway.json              # Railway platform config
├── package.json              # Wrapper server (openclaw-railway-wrapper)
├── .env.example              # Environment variable template
├── mock/
│   └── openclaw              # Mock CLI for local testing
├── skills/
│   └── searxng-local/        # Pre-bundled SearXNG search skill
├── src/
│   ├── server.js             # Express 5 entry point (all routes)
│   ├── health.js             # Health check router
│   ├── gateway.js            # Gateway process manager
│   ├── gateway-rpc.js        # WebSocket JSON-RPC client
│   ├── proxy.js              # Reverse proxy to gateway
│   ├── auth.js               # Password auth middleware
│   ├── channels.js           # 17 channel definitions
│   ├── terminal.js           # WebSocket PTY terminal (xterm.js)
│   ├── onboard-page.js       # Setup wizard HTML (5-step)
│   ├── ui-page.js            # Lite management panel HTML
│   ├── login-page.js         # Login page HTML
│   ├── i18n.js               # Internationalization (5 languages)
│   ├── cookie-parser.js      # Cookie parsing utility
│   └── schema/
│       ├── index.js           # Schema registry (Ajv validation)
│       ├── form-meta.js       # UI metadata for config editor
│       ├── migrate.js         # Legacy config migration
│       ├── validate.js        # Ajv wrapper
│       └── sections/          # 13 JSON Schema files
│           ├── root.schema.json
│           ├── agents.schema.json
│           ├── auth.schema.json
│           ├── channels.schema.json
│           ├── cron.schema.json
│           ├── gateway.schema.json
│           ├── hooks.schema.json
│           ├── memory.schema.json
│           ├── misc.schema.json
│           ├── models.schema.json
│           ├── session.schema.json
│           ├── skills.schema.json
│           └── tools.schema.json
└── test/
    ├── channels.test.js       # Channel data integrity tests
    ├── config-builder.test.js # Config builder unit tests
    ├── deploy-flow.test.js    # E2E deploy flow tests
    └── helpers/
        ├── fixtures.js        # Test data for all 17 channels
        └── server-harness.js  # Server harness with mock CLI
```

### How It Works

```
                    ┌──────────────────────────────────┐
                    │         Wrapper Server            │
  Request ────────► │  (Express 5 on $PORT)             │
                    │                                    │
                    │  /health/*  ──► Health Router      │
                    │  /login     ──► Login Page         │
                    │  /onboard/* ──► Setup Wizard  [PW] │
                    │  /lite/*    ──► Dashboard     [PW] │
                    │  /*         ──► Reverse Proxy ─────┼──► OpenClaw Gateway
                    │  ws://      ──► WS Proxy     ─────┼──► (127.0.0.1:18789)
                    └──────────────────────────────────┘
                                                    [PW] = SETUP_PASSWORD required
```

1. Requests arrive at the wrapper server on `$PORT`
2. Health endpoints are served directly (no auth)
3. `/onboard` and `/lite` require `SETUP_PASSWORD` via Bearer token, query param, or cookie
4. All other HTTP traffic is proxied to the gateway on loopback
5. WebSocket upgrades are proxied without injecting auth headers (proxy headers stripped)
6. The gateway manager spawns, monitors, and auto-restarts the OpenClaw process

### Data Persistence

```
/data/                          # Railway volume mount
├── .openclaw/                  # OpenClaw state
│   ├── openclaw.json           # Main configuration
│   ├── gateway.token           # Auto-generated auth token
│   ├── sessions/               # Conversation sessions
│   └── memory/                 # Knowledge base files
├── workspace/                  # File storage
└── .npm-global/                # npm prefix (survives restarts)
    └── bin/                    # In-app upgraded openclaw binary
```

## API Endpoints

### Health (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Basic liveness check (always 200) |
| GET | `/health/live` | Liveness probe with uptime |
| GET | `/health/ready` | Readiness check (503 if gateway not running) |

### Login (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/login` | Login page |
| POST | `/login` | Login form submission (sets auth cookie) |

### Onboard (password required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/onboard` | Setup wizard page |
| POST | `/onboard/start` | Start gateway |
| POST | `/onboard/stop` | Stop gateway |
| GET | `/onboard/export` | Download state backup (`.tar.gz`) |
| GET | `/onboard/config` | Get `openclaw.json` |
| POST | `/onboard/config` | Save config (validated + migrated) |
| GET | `/onboard/api/status` | JSON status |
| GET | `/onboard/api/bwc-skills` | Build with Claude skills proxy |
| POST | `/onboard/api/run` | Run non-interactive deploy |
| POST | `/onboard/api/reset` | Stop gateway + delete config |
| WS | `/onboard/ws` | PTY terminal (`openclaw onboard`) |

### Lite Dashboard (password required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/lite` | Dashboard page |
| GET | `/lite/api/status` | Gateway status, model, channels |
| GET | `/lite/api/logs` | Recent log entries (supports polling) |
| POST | `/lite/api/gateway/start` | Start gateway |
| POST | `/lite/api/gateway/stop` | Stop gateway |
| POST | `/lite/api/gateway/restart` | Restart gateway |
| POST | `/lite/api/pairing/approve` | Approve device pairing |
| GET | `/lite/api/config` | Get config |
| POST | `/lite/api/config` | Save config |
| GET | `/lite/api/stats` | Skills + sessions count |
| GET | `/lite/api/usage` | 7-day token usage |
| GET | `/lite/api/memory` | Memory status |
| GET | `/lite/api/memory/search` | Memory full-text search |
| POST | `/lite/api/memory/index` | Trigger memory re-index |
| GET | `/lite/api/cron` | Scheduled tasks |
| POST | `/lite/api/security-audit` | Run security audit |
| GET | `/lite/api/version` | Version + upgrade check |
| POST | `/lite/api/restore` | Restore from backup |
| POST | `/lite/api/upgrade` | In-app upgrade |
| WS | `/lite/ws` | PTY terminal (bash shell) |

### Other (password required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/schemas` | Config schemas + form metadata |
| GET/POST | `/openclaw` | Redirect to gateway control UI |
| `*` | `/*` | Reverse proxy to gateway |

## Security

### Setup Password

The setup password protects `/onboard` and `/lite` from unauthorized access.

```bash
# Generate a secure password
make generate-password
# or
openssl rand -hex 24
```

Authentication is supported via:
- Bearer token in `Authorization` header
- Query parameter: `?password=YOUR_PASSWORD`
- Cookie: set automatically after login (24-hour expiry)

### Container Security

- Runs as non-root user (`openclaw:openclaw`, UID/GID 1001)
- tini as PID 1 for proper signal handling and zombie reaping
- Minimal runtime dependencies
- Volume mounts as root — entrypoint fixes ownership then drops to `openclaw` via `su`

### Gateway Auth Model

- Gateway binds to `127.0.0.1` only — not accessible from outside the container
- All external traffic goes through the wrapper server
- The wrapper enforces `SETUP_PASSWORD` on management endpoints
- Gateway token is auto-generated and stored in the persistent volume
- WebSocket proxy strips forwarded headers to prevent scope escalation

### Best Practices

1. **Use a strong setup password** — it protects gateway control and configuration export
2. **Store API keys in Railway variables** — use Railway's secret environment variables
3. **Keep backups** — use the dashboard's backup feature or `/onboard/export`
4. **Monitor health endpoints** — set up Railway notifications for failures
5. **Use HTTPS** — Railway provides automatic SSL for all deployments

## Local Development

```bash
# Clone the repository
git clone https://github.com/protemplate/openclaw-railway
cd openclaw-railway

# Quick start with auto-generated password
make run

# Or use docker-compose
make deploy-local

# Access at http://localhost:8080/onboard
```

### Make Targets

| Target | Description |
|--------|-------------|
| `make build` | Build production Docker image |
| `make build-local` | Build local dev image (mock CLI, no upstream repo needed) |
| `make run` | Run locally with auto-generated password |
| `make stop` | Stop running container |
| `make test` | Test production build and endpoints |
| `make test-local` | Test local dev build |
| `make deploy-local` | Deploy with docker-compose |
| `make logs` | View container logs |
| `make shell` | Open shell in running container |
| `make clean` | Remove containers, images, and volumes |
| `make generate-password` | Generate a secure setup password |

### Testing

Three test layers using Node.js built-in test runner:

```bash
make test          # Production build tests
make test-local    # Local build tests
```

- **Layer 1** — Channel data integrity (17 channels, categories, fields)
- **Layer 2** — Config builder unit tests (field mapping, array conversion)
- **Layer 3** — E2E deploy flow (spawns server with mock CLI, tests each channel)

## Troubleshooting

### Gateway fails to start

- Check Railway logs for error messages
- Ensure the `/data` volume is properly mounted
- Verify environment variables are set correctly
- Check `/health/ready` — returns 503 if gateway is not running

### Setup wizard returns 401

- Check that `SETUP_PASSWORD` is set in Railway variables
- Try the query parameter: `?password=YOUR_PASSWORD`
- Clear browser cookies and try again

### Connection refused errors

- Ensure the gateway is running (check `/health/ready`)
- Verify Railway networking is configured correctly
- For private networking, always include the port: `http://openclaw.railway.internal:PORT`

### Data not persisting

- Confirm volume is mounted at `/data`
- Check volume permissions in Railway dashboard

### In-app upgrade fails

- Check that `/data/.npm-global` exists and is writable
- View logs in the dashboard activity feed
- As a fallback, redeploy the service in Railway to get the latest Docker image

### CLI pairing shows "pairing required"

- Use the dashboard's pairing approval feature at `/lite`
- Ensure the gateway is running and accessible

### Viewing Logs

```bash
# Local development
make logs

# Railway
railway logs
```

## Private Networking

Railway's private networking is automatically supported for service-to-service communication.

- **Public**: `https://your-app.railway.app`
- **Private**: `http://openclaw.railway.internal:PORT`

**Important:** Always include the PORT in private network URLs. Without it, connections default to port 80 and will fail.

```bash
# From other Railway services
OPENCLAW_URL=${{OpenClaw.RAILWAY_PRIVATE_DOMAIN}}:${{OpenClaw.PORT}}
```

## Links

- [OpenClaw Documentation](https://github.com/openclaw/openclaw)
- [Railway Documentation](https://docs.railway.app)
- [Report Issues](https://github.com/protemplate/openclaw-railway/issues)
- [OpenClaw + SearXNG Template](https://railway.com/deploy/jOiw-W)
- [OpenClaw + Plano Template](https://railway.com/deploy/plano-ai)

## License

This template is open source and available under the [MIT License](LICENSE).

---

Made with care for the AI assistant community
