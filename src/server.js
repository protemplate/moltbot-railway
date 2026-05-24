/**
 * OpenClaw Railway Template - Wrapper Server
 *
 * Express server that:
 * 1. Exposes health check endpoints (no auth required)
 * 2. Protects /onboard with SETUP_PASSWORD
 * 3. Provides web terminal for `openclaw onboard` wizard
 * 4. Spawns and monitors OpenClaw gateway process
 * 5. Reverse proxies traffic to the gateway
 * 6. Handles WebSocket upgrades
 * 7. Provides /onboard/export for backups
 */

import express from 'express';
import { createServer } from 'http';
import { existsSync, readFileSync, writeFileSync, mkdirSync, createWriteStream, readdirSync, lstatSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import JSZip from 'jszip';
import archiver from 'archiver';
import { siAnthropic, siGooglegemini, siOpenrouter, siVercel, siCloudflare, siOllama } from 'simple-icons';
import { CHANNEL_GROUPS, buildChannelConfig, getChannelIcon, getRequiredPlugin } from './channels.js';
import { AUTH_GROUPS, AUTH_OPTION_MAP } from './auth-groups.js';
import { validate, migrateConfig, getAllSchemas } from './schema/index.js';

import healthRouter, { setGatewayReady } from './health.js';
import { createAuthMiddleware } from './auth.js';
import { startGateway, stopGateway, isGatewayRunning, getGatewayInfo, getGatewayToken, runCmd, runExec, deleteConfig, getRecentLogs, getGatewayUptime, sanitizeOpenClawConfig } from './gateway.js';
import { gatewayRPC } from './gateway-rpc.js';
import { createProxy } from './proxy.js';
import { createTerminalServer, closeAllSessions } from './terminal.js';
import { getSetupPageHTML } from './onboard-page.js';
import { getUIPageHTML } from './ui-page.js';
import { getLoginPageHTML } from './login-page.js';

// Configuration
const PORT = process.env.PORT || 8080;
const SETUP_PASSWORD = process.env.SETUP_PASSWORD;
const OPENCLAW_STATE_DIR = process.env.OPENCLAW_STATE_DIR || '/data/.openclaw';

// Custom SVG paths for providers not in simple-icons (viewBox 0 0 24 24)
const CUSTOM_ICONS = {
  'OpenAI': {
    svg: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4114-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0974-2.3616l2.603-1.5018 2.6032 1.5018v3.0036l-2.6032 1.5018-2.603-1.5018z',
    color: '#412991'
  },
  'Venice AI': {
    svg: 'M12 2L2 22h4l6-14 6 14h4L12 2z',
    color: '#7C3AED'
  },
  'Together AI': {
    svg: 'M4 4h16v4H14v14h-4V8H4V4z',
    color: '#0EA5E9'
  },
  'Moonshot AI': {
    svg: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.82 0 3.53-.49 5-1.35A8 8 0 0 1 10 12a8 8 0 0 1 7-7.93A9.96 9.96 0 0 0 12 2z',
    color: '#6366F1'
  },
  'Kimi Coding': {
    svg: 'M6 3v18h4v-7l6 7h5l-7.5-8.5L20 3h-5l-5 6V3H6z',
    color: '#F59E0B'
  },
  'Z.AI (GLM)': {
    svg: 'M4 4h16v4l-10.5 8H20v4H4v-4l10.5-8H4V4z',
    color: '#3B82F6'
  },
  'Custom Provider': {
    svg: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    color: '#a78bfa'
  }
};

// Map provider display names to simple-icons objects
const SIMPLE_ICONS_MAP = {
  'Anthropic': siAnthropic,
  'Google / Gemini': siGooglegemini,
  'OpenRouter': siOpenrouter,
  'Vercel AI Gateway': siVercel,
  'Cloudflare AI Gateway': siCloudflare,
  'Ollama': siOllama
};

// Look up icon data for a provider by display name
function getProviderIcon(name) {
  const si = SIMPLE_ICONS_MAP[name];
  if (si) return { svg: si.path, color: '#' + si.hex };
  const custom = CUSTOM_ICONS[name];
  if (custom) return { svg: custom.svg, color: custom.color };
  return null;
}

// Auth provider groups for the simple mode form live in ./auth-groups.js.
// Enrich each imported provider group with SVG icon data.
for (const group of AUTH_GROUPS) {
  group.icon = getProviderIcon(group.provider);
}


/**
 * Create an auto-backup of the state directory to a temp file
 * @returns {Promise<string>} Path to the backup tar.gz
 */
async function createAutoBackup() {
  const backupPath = join(tmpdir(), `openclaw-auto-backup-${Date.now()}.tar.gz`);
  return new Promise((resolve, reject) => {
    const output = createWriteStream(backupPath);
    const archive = archiver('tar', { gzip: true });
    output.on('close', () => resolve(backupPath));
    archive.on('error', reject);
    archive.pipe(output);
    if (existsSync(OPENCLAW_STATE_DIR)) {
      archive.directory(OPENCLAW_STATE_DIR, '.openclaw');
    }
    archive.finalize();
  });
}

/**
 * Install a Build with Claude skill by downloading and extracting its zip
 * @param {string} slug - Skill slug
 * @param {string} skillsDir - Target directory for skills
 * @returns {Promise<void>}
 */
async function installBwcSkill(slug, skillsDir) {
  const url = `https://buildwithclaude.com/api/skills/${encodeURIComponent(slug)}/download`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download skill "${slug}": ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const targetDir = join(skillsDir, slug);
  mkdirSync(targetDir, { recursive: true });

  for (const [relativePath, entry] of Object.entries(zip.files)) {
    if (entry.dir) {
      mkdirSync(join(skillsDir, relativePath), { recursive: true });
      continue;
    }
    const content = await entry.async('nodebuffer');
    // Strip leading slug directory if the zip wraps files in a folder
    const parts = relativePath.split('/');
    let outPath;
    if (parts[0] === slug && parts.length > 1) {
      outPath = join(targetDir, parts.slice(1).join('/'));
    } else {
      outPath = join(skillsDir, relativePath);
    }
    const dir = join(outPath, '..');
    mkdirSync(dir, { recursive: true });
    writeFileSync(outPath, content);
  }
}

/**
 * Install a ClawHub skill via npx clawhub install
 * @param {string} slug - Skill slug
 * @param {string} skillsDir - Target directory for skills
 * @returns {Promise<{stdout: string, stderr: string, code: number}>}
 */
async function installClawHubSkill(slug, skillsDir) {
  return runExec('npx', ['clawhub', 'install', slug, '--dir', skillsDir]);
}

// Create Express app
const app = express();

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple cookie parser
app.use((req, res, next) => {
  const cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
    });
  }
  req.cookies = cookies;
  next();
});

// Health check endpoints - no authentication required
app.use('/health', healthRouter);

// Login page - no authentication required
app.get('/login', (req, res) => {
  const redirect = req.query.redirect || '/onboard';
  // If already authenticated (cookie), redirect immediately
  if (req.cookies?.openclaw_auth === SETUP_PASSWORD) {
    return res.redirect(redirect);
  }
  res.send(getLoginPageHTML({ redirect }));
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  const redirect = req.body.redirect || req.query.redirect || '/onboard';
  if (password === SETUP_PASSWORD) {
    res.cookie('openclaw_auth', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    return res.redirect(redirect);
  }
  // Wrong password - re-render login with error
  res.status(401).send(getLoginPageHTML({ redirect, error: 'Invalid password' }));
});

// Setup authentication middleware
const authMiddleware = createAuthMiddleware(SETUP_PASSWORD);

// Setup wizard routes - main page with web terminal and status
// Handle both GET and POST (POST comes from login form)
const setupHandler = (req, res) => {
  const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
  const isConfigured = existsSync(configFile);
  const gatewayInfo = getGatewayInfo();
  const password = req.query.password || req.body?.password || req.cookies?.openclaw_auth || '';

  res.send(getSetupPageHTML({
    isConfigured,
    gatewayInfo,
    password,
    stateDir: OPENCLAW_STATE_DIR,
    gatewayToken: getGatewayToken(),
    authGroups: AUTH_GROUPS,
    channelGroups: CHANNEL_GROUPS
  }));
};

app.get('/onboard', authMiddleware, setupHandler);
app.post('/onboard', authMiddleware, setupHandler);

// Start gateway
app.post('/onboard/start', authMiddleware, async (req, res) => {
  try {
    await startGateway();
    res.redirect(`/onboard?password=${req.query.password || req.body.password || ''}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop gateway
app.post('/onboard/stop', authMiddleware, async (req, res) => {
  try {
    await stopGateway();
    res.redirect(`/onboard?password=${req.query.password || req.body.password || ''}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export backup
app.get('/onboard/export', authMiddleware, (req, res) => {
  const archive = archiver('tar', { gzip: true });

  res.attachment('openclaw-backup.tar.gz');
  archive.pipe(res);

  // Add state directory to archive
  if (existsSync(OPENCLAW_STATE_DIR)) {
    archive.directory(OPENCLAW_STATE_DIR, '.openclaw');
  }

  archive.finalize();
});

// Get config
app.get('/onboard/config', authMiddleware, (req, res) => {
  const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
  if (existsSync(configFile)) {
    try {
      const config = JSON.parse(readFileSync(configFile, 'utf-8'));
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to parse config file' });
    }
  } else {
    res.json(null);
  }
});

// Save config
app.post('/onboard/config', authMiddleware, (req, res) => {
  try {
    const config = req.body;

    // Auto-migrate legacy keys before validation
    const { migrated } = migrateConfig(config);

    // Validate against schema
    const result = validate(config);
    if (!result.valid) {
      return res.status(400).json({ error: 'Validation failed', errors: result.errors });
    }

    const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
    writeFileSync(configFile, JSON.stringify(config, null, 2));
    res.json({ success: true, migrated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Simple Mode API endpoints ---

// Status endpoint
app.get('/onboard/api/status', authMiddleware, (req, res) => {
  const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
  res.json({
    configured: existsSync(configFile),
    gatewayRunning: isGatewayRunning(),
    authGroups: AUTH_GROUPS
  });
});

// Proxy Build with Claude skills list (avoids browser CORS issues)
app.get('/onboard/api/bwc-skills', authMiddleware, async (req, res) => {
  try {
    const response = await fetch('https://buildwithclaude.com/api/plugins/list?type=skill&limit=100');
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream API error' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: 'Failed to fetch skills from buildwithclaude.com' });
  }
});

// Run setup (simple mode)
app.post('/onboard/api/run', authMiddleware, async (req, res) => {
  try {
    const { authChoice, authSecret, extraFieldValues, flow, channels: channelPayload, skills } = req.body;
    const logs = [];

    const opt = AUTH_OPTION_MAP[authChoice];
    const isDeviceCode = !!opt?.deviceCode;
    const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');

    if (isDeviceCode) {
      // Device-code auth (e.g. ChatGPT/Codex pairing) is interactive-only and runs in the PTY
      // terminal (/onboard/ws?cmd=codex-device), which pairs with --skip-channels --skip-skills.
      // By the time the front-end calls this endpoint, pairing has already written the base
      // config + auth profile. We must NOT re-run onboard here (it would refuse
      // --non-interactive for a device-code choice, and could clobber the paired auth) — we
      // only apply the wizard's channels & skills to the existing config below.
      if (!existsSync(configFile)) {
        return res.json({
          success: false,
          logs: ['Device pairing has not completed yet — finish the pairing terminal first, then channels/skills can be applied.']
        });
      }
      logs.push('Device pairing detected — applying channels & skills to the paired config (no re-auth).');
    } else {
      // Build onboard command args
      const onboardArgs = ['--non-interactive', '--accept-risk', '--json'];

      if (flow) {
        onboardArgs.push('--flow', flow);
      }

      const flag = opt?.flag;
      if (flag) {
        if (Array.isArray(flag)) {
          onboardArgs.push(...flag);
          // For secretOptional providers (e.g. Plano), fall back to 'nokey' so the
          // flag is always passed and onboard doesn't prompt interactively.
          const secretVal = authSecret || (opt.secretOptional ? 'nokey' : null);
          if (opt.secretFlag && secretVal) {
            onboardArgs.push(opt.secretFlag, secretVal);
          }
        } else if (authSecret) {
          onboardArgs.push(flag, authSecret);
        }
      }

      // Handle extra fields (e.g., Cloudflare account/gateway IDs)
      if (opt?.extraFields && extraFieldValues) {
        for (const field of opt.extraFields) {
          if (field.noFlag) continue;
          const val = extraFieldValues[field.id];
          if (val && field.flag) {
            onboardArgs.push(field.flag, val);
          }
        }
      }

      // Run onboard
      logs.push('> openclaw onboard ' + onboardArgs.map(a => a.startsWith('--') ? a : '***').join(' '));
      const onboardResult = await runCmd('onboard', onboardArgs);
      if (onboardResult.stdout) logs.push(onboardResult.stdout.trim());
      if (onboardResult.stderr) logs.push(onboardResult.stderr.trim());

      if (onboardResult.code !== 0) {
        // onboard always tries to verify the gateway connection after writing config.
        // Since no gateway is running yet (we start it below), the verification fails
        // and onboard exits non-zero. Check if config was actually written — if so,
        // treat the gateway verification failure as non-fatal and continue.
        if (!existsSync(configFile)) {
          return res.json({ success: false, logs });
        }
        logs.push('(Gateway verification skipped — gateway will be started next)');
      }
    }

    // Patch custom provider fields that the CLI doesn't handle (provider name, context window)
    // OpenClaw stores providers at config.models.providers.<key> with models as array of objects
    if (existsSync(configFile) && extraFieldValues) {
      try {
        const config = JSON.parse(readFileSync(configFile, 'utf8'));
        const cfgProviders = config.models?.providers;
        if (cfgProviders && typeof cfgProviders === 'object') {
          for (const [key, providerEntry] of Object.entries(cfgProviders)) {
            if (!providerEntry || !Array.isArray(providerEntry.models)) continue;
            // Set contextWindow on individual model entries
            const ctxVal = extraFieldValues['custom-context-window'];
            if (ctxVal) {
              const ctxNum = parseInt(ctxVal, 10);
              for (const model of providerEntry.models) {
                if (model && typeof model === 'object' && model.id) {
                  model.contextWindow = ctxNum;
                  logs.push(`Set contextWindow=${ctxNum} for model "${model.id}" in provider "${key}"`);
                }
              }
            }
            // Rename provider key if custom name provided
            const newName = extraFieldValues['custom-provider-name']?.trim();
            if (newName && newName !== key) {
              cfgProviders[newName] = providerEntry;
              delete cfgProviders[key];
              logs.push(`Renamed provider "${key}" → "${newName}"`);
              // Also update agents.defaults.model.primary if it references the old provider key
              const primary = config.agents?.defaults?.model?.primary;
              if (primary && primary.startsWith(key + '/')) {
                config.agents.defaults.model.primary = newName + '/' + primary.slice(key.length + 1);
                logs.push(`Updated primary model ref: ${primary} → ${config.agents.defaults.model.primary}`);
              }
            }
          }
          sanitizeOpenClawConfig(config);
          writeFileSync(configFile, JSON.stringify(config, null, 2));
        }
      } catch (e) {
        logs.push(`Warning: failed to patch custom provider config: ${e.message}`);
      }
    }

    // Install skill files to disk (downloads are independent of gateway state)
    if (skills && Array.isArray(skills)) {
      const skillsDir = join(OPENCLAW_STATE_DIR, 'skills');
      mkdirSync(skillsDir, { recursive: true });

      for (const item of skills) {
        const slug = typeof item === 'string' ? item : item.slug;
        const source = typeof item === 'string' ? 'clawhub' : (item.source || 'clawhub');

        try {
          if (source === 'buildwithclaude') {
            logs.push(`Installing skill: ${slug} from buildwithclaude...`);
            await installBwcSkill(slug, skillsDir);
            logs.push(`Installed skill: ${slug}`);
          } else {
            logs.push(`Installing skill: ${slug} from clawhub...`);
            const result = await installClawHubSkill(slug, skillsDir);
            if (result.code !== 0) {
              logs.push(`Warning: clawhub install ${slug} exited with code ${result.code}`);
              if (result.stderr) logs.push(result.stderr.trim());
            } else {
              logs.push(`Installed skill: ${slug}`);
            }
          }
        } catch (err) {
          logs.push(`Warning: Failed to install skill ${slug}: ${err.message}`);
        }

        // Verify SKILL.md exists after install
        const skillDir = join(skillsDir, slug);
        if (!existsSync(join(skillDir, 'SKILL.md'))) {
          logs.push(`Warning: ${slug} installed but SKILL.md not found — skill may not be discoverable`);
        }
      }
    }

    // Install required channel plugins (must happen before gateway start)
    for (const ch of channelPayload || []) {
      const plugin = getRequiredPlugin(ch.name);
      if (plugin) {
        logs.push(`Installing channel plugin: ${plugin}...`);
        const result = await runCmd('plugins', ['install', plugin]);
        if (result.code === 0) {
          logs.push(`Installed plugin: ${plugin}`);
        } else {
          logs.push(`Warning: plugin install ${plugin} failed: ${(result.stderr || '').trim()}`);
        }
      }
    }

    // Start gateway first — it rewrites openclaw.json on startup (v2026.2.22+),
    // so we configure channels/skills AFTER the gateway has initialized.
    logs.push('> Starting gateway...');
    await startGateway();
    logs.push('Gateway started.');

    // Configure channels and skills via the CLI's `config set` command.
    // This goes through the gateway's proper validation pipeline and avoids
    // the file-level race condition where the gateway rewrites openclaw.json
    // on startup (v2026.2.22+), overwriting our raw JSON writes.
    const hasChannels = channelPayload && channelPayload.length > 0;
    const hasSkills = skills && Array.isArray(skills) && skills.length > 0;

    if (hasChannels || hasSkills) {
      // Wait for the gateway's RPC to stabilize before pushing config.
      // startGateway() only checks HTTP liveness; the WebSocket/CLI may
      // need a moment longer to accept config changes.
      const maxWaitAttempts = 6;
      const waitInterval = 1000;
      let rpcReady = false;
      for (let i = 0; i < maxWaitAttempts && !rpcReady; i++) {
        try {
          await gatewayRPC('config.get', {});
          rpcReady = true;
        } catch {
          await new Promise(r => setTimeout(r, waitInterval));
        }
      }
      if (!rpcReady) {
        logs.push('Warning: gateway RPC not ready, proceeding with CLI config set anyway');
      }

      // Configure each channel via `openclaw config set --json channels.<name> <value>`
      for (const ch of channelPayload || []) {
        const channelConfig = buildChannelConfig(ch.name, ch.fields);
        const result = await runCmd('config', [
          'set', '--json',
          `channels.${ch.name}`,
          JSON.stringify(channelConfig)
        ]);
        if (result.code === 0) {
          logs.push(`Configured channel: ${ch.name}`);
        } else {
          logs.push(`Warning: failed to configure channel ${ch.name}: ${(result.stderr || '').trim()}`);
        }
      }

      // Configure each skill via `openclaw config set --json skills.entries.<slug> {"enabled":true}`
      if (hasSkills) {
        for (const item of skills) {
          const slug = typeof item === 'string' ? item : item.slug;
          const result = await runCmd('config', [
            'set', '--json',
            `skills.entries.${slug}`,
            JSON.stringify({ enabled: true })
          ]);
          if (result.code === 0) {
            logs.push(`Enabled skill: ${slug}`);
          } else {
            logs.push(`Warning: failed to enable skill ${slug}: ${(result.stderr || '').trim()}`);
          }
        }
      }

      // Config changes trigger gateway self-restart via SIGUSR1.
      // Wait for the daemon to come back up so the wrapper can re-adopt it,
      // otherwise isGatewayRunning() returns false and the proxy returns 503.
      // Skip this if there's no real gateway (e.g. test/mock environment).
      // The mock gateway returns { mock: true } in its HTTP responses.
      const gwPort = process.env.INTERNAL_GATEWAY_PORT || '18789';
      let hasRealGateway = false;
      try {
        const gwRes = await fetch(`http://127.0.0.1:${gwPort}/health`);
        const gwData = await gwRes.json();
        hasRealGateway = !gwData.mock;
      } catch { /* no gateway on this port */ }

      if (hasRealGateway) {
        // Give the gateway time to detect the config change and restart
        await new Promise(r => setTimeout(r, 5000));
        let stabilized = false;
        for (let i = 0; i < 8; i++) {
          try {
            await fetch(`http://127.0.0.1:${gwPort}/health`);
            stabilized = true;
            break;
          } catch { /* still restarting */ }
          await new Promise(r => setTimeout(r, 2000));
        }
        if (stabilized) {
          // Re-adopt the restarted daemon so isGatewayRunning() stays true
          await startGateway();
          logs.push('Gateway stabilized after config change.');
        } else {
          logs.push('Warning: gateway did not stabilize after config change');
        }
      }
    }

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, logs: [error.message] });
  }
});

// Reset configuration
app.post('/onboard/api/reset', authMiddleware, async (req, res) => {
  try {
    if (isGatewayRunning()) {
      await stopGateway();
    }
    deleteConfig();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Diagnostic endpoint: run CLI commands for troubleshooting
app.get('/onboard/api/diag', authMiddleware, async (req, res) => {
  try {
    const results = {};
    const commands = [
      { name: 'status', cmd: 'status', args: ['--deep'] },
      { name: 'channels-status', cmd: 'channels', args: ['status', '--probe'] },
    ];
    for (const { name, cmd, args } of commands) {
      const result = await runCmd(cmd, args);
      results[name] = { stdout: result.stdout, stderr: result.stderr, code: result.code };
    }

    // Also include raw config channels for inspection
    const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
    try {
      const rawConfig = JSON.parse(readFileSync(configFile, 'utf-8'));
      results.config = {
        channels: rawConfig.channels || {},
        gatewayPort: rawConfig.config?.gateway?.port,
      };
    } catch { results.config = { error: 'Could not read config file' }; }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Lite Management Panel (/lite) routes ---

// Main UI page
const uiHandler = (req, res) => {
  const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
  const isConfigured = existsSync(configFile);

  // Redirect to /onboard if not configured
  if (!isConfigured) {
    const pw = req.query.password || req.body?.password || req.cookies?.openclaw_auth || '';
    return res.redirect(`/onboard?password=${encodeURIComponent(pw)}`);
  }

  const gatewayInfo = getGatewayInfo();
  const pw = req.query.password || req.body?.password || req.cookies?.openclaw_auth || '';

  res.send(getUIPageHTML({
    isConfigured,
    gatewayInfo,
    password: pw,
    stateDir: OPENCLAW_STATE_DIR,
    gatewayToken: getGatewayToken(),
    uptime: getGatewayUptime(),
    channelGroups: CHANNEL_GROUPS,
    authGroups: AUTH_GROUPS
  }));
};

app.get('/lite', authMiddleware, uiHandler);
app.post('/lite', authMiddleware, uiHandler);

// Lite API: Status
app.get('/lite/api/status', authMiddleware, (req, res) => {
  const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
  const isConfigured = existsSync(configFile);
  const gatewayInfo = getGatewayInfo();

  let model = null;
  let channels = null;
  let auth = null;
  if (isConfigured) {
    try {
      const config = JSON.parse(readFileSync(configFile, 'utf-8'));
      // Support both new and legacy config shapes
      model = config.agents?.defaults?.model?.primary || config.agents?.defaults?.model || config.agent?.model || null;
      channels = config.channels || null;
      auth = config.auth || null;
    } catch {
      // ignore parse errors
    }
  }

  res.json({
    configured: isConfigured,
    gatewayRunning: isGatewayRunning(),
    gatewayInfo,
    uptime: getGatewayUptime(),
    model,
    channels,
    auth,
    timestamp: new Date().toISOString()
  });
});

// Lite API: Logs
app.get('/lite/api/logs', authMiddleware, (req, res) => {
  const sinceId = parseInt(req.query.since, 10) || 0;
  res.json(getRecentLogs(sinceId));
});

// Lite API: Gateway start
app.post('/lite/api/gateway/start', authMiddleware, async (req, res) => {
  try {
    await startGateway();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lite API: Gateway stop
app.post('/lite/api/gateway/stop', authMiddleware, async (req, res) => {
  try {
    await stopGateway();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lite API: Gateway restart
app.post('/lite/api/gateway/restart', authMiddleware, async (req, res) => {
  try {
    if (isGatewayRunning()) {
      await stopGateway();
    }
    await startGateway();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lite API: Pairing approval
app.post('/lite/api/pairing/approve', authMiddleware, async (req, res) => {
  try {
    const { channel, code } = req.body;
    if (!channel || !code) {
      return res.status(400).json({ success: false, error: 'channel and code are required' });
    }
    const result = await runCmd('pairing', ['approve', channel, code]);
    if (result.code === 0) {
      let message = result.stdout.trim();
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(message);
        return res.json({ success: true, message: parsed.message || message });
      } catch {
        return res.json({ success: true, message });
      }
    } else {
      res.json({ success: false, error: result.stderr.trim() || result.stdout.trim() || 'Pairing approval failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lite API: Get config
app.get('/lite/api/config', authMiddleware, (req, res) => {
  const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
  if (existsSync(configFile)) {
    try {
      const config = JSON.parse(readFileSync(configFile, 'utf-8'));
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to parse config file' });
    }
  } else {
    res.json(null);
  }
});

// Lite API: Save config
app.post('/lite/api/config', authMiddleware, (req, res) => {
  try {
    const config = req.body;

    // Auto-migrate legacy keys before validation
    const { migrated } = migrateConfig(config);

    // Validate against schema
    const result = validate(config);
    if (!result.valid) {
      return res.status(400).json({ success: false, error: 'Validation failed', errors: result.errors });
    }

    const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
    writeFileSync(configFile, JSON.stringify(config, null, 2));
    res.json({ success: true, migrated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lite API: Quick stats (skills count + sessions count)
app.get('/lite/api/stats', authMiddleware, async (req, res) => {
  let skillsCount = null;
  const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
  if (existsSync(configFile)) {
    try {
      const config = JSON.parse(readFileSync(configFile, 'utf-8'));
      const entries = config.skills?.entries;
      skillsCount = entries ? Object.keys(entries).length : 0;
    } catch { /* ignore parse errors */ }
  }

  let sessionsCount = null;
  try {
    const result = await gatewayRPC('sessions.list', { includeGlobal: true, limit: 100 });
    if (Array.isArray(result)) {
      sessionsCount = result.length;
    } else if (result?.count != null) {
      sessionsCount = result.count;
    } else if (Array.isArray(result?.sessions)) {
      sessionsCount = result.sessions.length;
    }
  } catch (err) {
    // sessions.list RPC failed, will try CLI fallback
  }

  if (sessionsCount == null) {
    try {
      const cliResult = await runCmd('sessions', ['--json']);
      if (cliResult.code === 0) {
        const parsed = JSON.parse(cliResult.stdout);
        if (Array.isArray(parsed)) {
          sessionsCount = parsed.length;
        } else if (parsed?.count != null) {
          sessionsCount = parsed.count;
        } else if (Array.isArray(parsed?.sessions)) {
          sessionsCount = parsed.sessions.length;
        }
      }
    } catch { /* CLI not available */ }
  }

  res.json({ skills: skillsCount, sessions: sessionsCount });
});

// Lite API: Daily token usage (via gateway WebSocket RPC)
app.get('/lite/api/usage', authMiddleware, async (req, res) => {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let rawDays = null;
  let totals = null;

  // Try gateway RPC first
  try {
    const result = await gatewayRPC('usage.cost', { startDate, endDate });
    if (Array.isArray(result)) {
      rawDays = result;
    } else if (Array.isArray(result?.daily)) {
      rawDays = result.daily;
      totals = result.totals || null;
    } else if (Array.isArray(result?.days)) {
      rawDays = result.days;
      totals = result.totals || null;
    }
  } catch (err) {
    // usage.cost RPC failed, will try CLI fallback
  }

  // CLI fallback: `openclaw usage --json`
  if (!rawDays) {
    try {
      const cliResult = await runCmd('usage', ['--json']);
      if (cliResult.code === 0) {
        const parsed = JSON.parse(cliResult.stdout);
        if (Array.isArray(parsed)) {
          rawDays = parsed;
        } else if (Array.isArray(parsed?.daily)) {
          rawDays = parsed.daily;
          totals = parsed.totals || null;
        } else if (Array.isArray(parsed?.days)) {
          rawDays = parsed.days;
          totals = parsed.totals || null;
        }
      }
    } catch { /* CLI not available */ }
  }

  if (!rawDays || rawDays.length === 0) {
    return res.json({ available: false, days: [] });
  }

  const days = rawDays.map(d => ({
    date: d.date,
    output: d.output || 0,
    input: d.input || 0,
    cacheWrite: d.cacheWrite || 0,
    cacheRead: d.cacheRead || 0,
    total: d.totalTokens || d.total || 0,
    cost: d.totalCost || d.cost || 0
  }));
  return res.json({ available: true, days, totals });
});

// Lite API: Memory status
app.get('/lite/api/memory', authMiddleware, async (req, res) => {
  try {
    const result = await runCmd('memory', ['status', '--json']);
    if (result.code !== 0) {
      return res.json({ available: false });
    }
    try {
      const parsed = JSON.parse(result.stdout);
      // openclaw memory status --json returns an array of agent objects
      const agent = Array.isArray(parsed) ? parsed[0] : parsed;
      const st = agent?.status || agent || {};
      // List actual memory files for debugging across all possible locations
      let memoryFiles = {};
      const scanDirs = {
        '/data/workspace': 'volume-workspace',
        '/data/workspace/memory': 'volume-workspace-memory',
        '/data/.openclaw/workspace': 'volume-state-workspace',
        '/data/.openclaw/workspace/memory': 'volume-state-workspace-memory',
        '/home/openclaw/.openclaw/workspace': 'home-workspace',
        '/home/openclaw/.openclaw/workspace/memory': 'home-workspace-memory',
      };
      for (const [dir, label] of Object.entries(scanDirs)) {
        try {
          const stat = lstatSync(dir);
          const isLink = stat.isSymbolicLink();
          const files = readdirSync(dir).filter(f =>
            f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.txt')
          );
          if (files.length > 0 || isLink) {
            memoryFiles[label] = { files, isSymlink: isLink };
          }
        } catch {}
      }

      // Count workspace .md files as "indexed" for the UI since our fallback searches them
      let workspaceFileCount = 0;
      try {
        workspaceFileCount = readdirSync('/data/workspace').filter(f =>
          f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.txt')
        ).length;
      } catch {}
      const ftsEntries = st.files ?? st.chunks ?? 0;

      return res.json({
        available: true,
        status: st.fts?.available ? 'active' : 'inactive',
        entries: ftsEntries > 0 ? ftsEntries : workspaceFileCount,
        totalFiles: Math.max(agent?.scan?.totalFiles ?? 0, workspaceFileCount),
        backend: st.backend || null,
        provider: st.provider || null,
        searchMode: st.custom?.searchMode || null,
        memoryFiles
      });
    } catch {
      return res.json({ available: true, status: result.stdout.trim() });
    }
  } catch {
    res.json({ available: false });
  }
});

// Lite API: Memory search
app.get('/lite/api/memory/search', authMiddleware, async (req, res) => {
  const q = req.query.q;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }
  try {
    const result = await runCmd('memory', ['search', q, '--json']);
    if (result.code !== 0) {
      return res.json({ available: false, results: [] });
    }
    let results = [];
    try {
      const parsed = JSON.parse(result.stdout);
      results = Array.isArray(parsed) ? parsed : (parsed.results || []);
    } catch {
      if (result.stdout.trim()) {
        results = [{ text: result.stdout.trim() }];
      }
    }

    // If CLI search returns empty, try reading memory files directly as fallback
    // Check all possible locations where OpenClaw may store memory files
    if (results.length === 0) {
      const searchDirs = [
        '/data/workspace',
        '/data/workspace/memory',
        '/data/.openclaw/workspace',
        '/data/.openclaw/workspace/memory',
        '/home/openclaw/.openclaw/workspace',
        '/home/openclaw/.openclaw/workspace/memory',
      ];
      const seen = new Set();
      for (const memDir of searchDirs) {
        try {
          const files = readdirSync(memDir).filter(f =>
            f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.txt')
          );
          for (const file of files) {
            const filePath = join(memDir, file);
            if (seen.has(file)) continue; // avoid duplicates from symlinked dirs
            seen.add(file);
            const content = readFileSync(filePath, 'utf-8');
            if (content.toLowerCase().includes(q.toLowerCase())) {
              results.push({ text: content.trim(), source: `${memDir}/${file}` });
            }
          }
        } catch { /* dir doesn't exist or no readable files */ }
      }
    }

    return res.json({ results });
  } catch {
    res.json({ available: false, results: [] });
  }
});

// Lite API: Memory re-index
app.post('/lite/api/memory/index', authMiddleware, async (req, res) => {
  try {
    const result = await runCmd('memory', ['index']);
    const output = result.stdout.trim() || result.stderr.trim() || '';
    res.json({ success: result.code === 0, output });
  } catch (err) {
    res.json({ success: false, output: 'Failed to run memory index' });
  }
});

// Lite API: Scheduled tasks (cron)
app.get('/lite/api/cron', authMiddleware, async (req, res) => {
  try {
    const result = await runCmd('cron', ['list', '--json']);
    if (result.code !== 0) {
      return res.json({ available: false, jobs: [] });
    }
    try {
      const parsed = JSON.parse(result.stdout);
      return res.json({ available: true, jobs: Array.isArray(parsed) ? parsed : (parsed.jobs || []) });
    } catch {
      return res.json({ available: true, jobs: [] });
    }
  } catch {
    res.json({ available: false, jobs: [] });
  }
});

// Lite API: Security audit (config checks and optional live probing)
app.post('/lite/api/security-audit', authMiddleware, express.json(), async (req, res) => {
  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve({ stdout: '', stderr: 'timeout', code: 1 }), ms))
    ]);
  }

  const deep = req.body && req.body.deep === true;
  const timeout = deep ? 30000 : 10000;
  const args = deep ? ['audit', '--deep', '--json'] : ['audit', '--json'];

  try {
    // Try JSON mode first
    const jsonResult = await withTimeout(runCmd('security', args), timeout);
    if (jsonResult.code === 0 && jsonResult.stdout.trim()) {
      try {
        const parsed = JSON.parse(jsonResult.stdout);
        return res.json({ available: true, format: 'json', findings: Array.isArray(parsed) ? parsed : (parsed.findings || []), deep });
      } catch { /* fall through to text */ }
    }

    // Fall back to text mode
    const textArgs = deep ? ['audit', '--deep'] : ['audit'];
    const textResult = await withTimeout(runCmd('security', textArgs), timeout);
    if (textResult.code !== 0 && !textResult.stdout.trim()) {
      return res.json({ available: false, error: 'security audit command not available', deep });
    }

    return res.json({ available: true, format: 'text', raw: textResult.stdout || '', deep });
  } catch {
    res.json({ available: false, error: 'Failed to run security audit', deep });
  }
});

// Lite API: Version check
app.get('/lite/api/version', authMiddleware, async (req, res) => {
  const steps = [];
  let current = null;
  let latest = null;
  let baseVersion = null;
  let upgradeMethod = 'redeploy';
  let versions = [];
  let isNpmInstalled = false;

  // Check current running version
  try {
    const vResult = await runCmd('--version');
    const versionOutput = (vResult.stdout || '').trim().replace(/^openclaw\s*/i, '');
    // Extract clean version (e.g. "2026.3.8") stripping commit hash like "2026.3.8 (3caab92)"
    current = versionOutput.split(/\s/)[0] || null;
    steps.push('Current version: ' + (current || 'unknown'));
  } catch {
    steps.push('Could not determine current version');
  }

  // Check base (Docker-baked) version
  try {
    const baseResult = await runExec('node', ['-e', "try{const p=require('/usr/local/lib/node_modules/openclaw/package.json');console.log(p.version)}catch{console.log('unknown')}"]);
    baseVersion = (baseResult.stdout || '').trim() || null;
    if (baseVersion === 'unknown') baseVersion = null;
    steps.push('Base version: ' + (baseVersion || 'unknown'));
  } catch {
    steps.push('Could not determine base version');
  }

  // Check if npm-installed version exists (vs Docker-baked)
  const npmPrefix = process.env.NPM_CONFIG_PREFIX || '/data/.npm-global';
  const npmEntryPath = join(npmPrefix, 'lib', 'node_modules', 'openclaw', 'dist', 'entry.js');
  isNpmInstalled = existsSync(npmEntryPath);
  steps.push('npm-installed: ' + (isNpmInstalled ? 'yes' : 'no (using Docker base)'));

  // Check latest npm version and list available versions
  try {
    const npmResult = await runExec('npm', ['view', 'openclaw', 'version']);
    if (npmResult.code === 0 && npmResult.stdout.trim()) {
      latest = npmResult.stdout.trim();
      upgradeMethod = 'npm';
      steps.push('Latest npm version: ' + latest);
    } else {
      steps.push('npm package not found, use redeploy to update');
    }
  } catch {
    steps.push('npm check failed, use redeploy to update');
  }

  // List recent npm versions
  try {
    const versionsResult = await runExec('npm', ['view', 'openclaw', 'versions', '--json']);
    if (versionsResult.code === 0 && versionsResult.stdout.trim()) {
      const allVersions = JSON.parse(versionsResult.stdout.trim());
      // Return last 15 versions, newest first
      versions = Array.isArray(allVersions) ? allVersions.slice(-15).reverse() : [allVersions];
    }
  } catch { /* ignore */ }

  const upgradeAvailable = current && latest && current !== latest;
  res.json({ current, latest, baseVersion, upgradeAvailable, upgradeMethod, isNpmInstalled, versions, steps });
});

// Lite API: Restore from backup
app.post('/lite/api/restore', authMiddleware, express.raw({ type: 'application/octet-stream', limit: '500mb' }), async (req, res) => {
  const steps = [];
  let autoBackupPath = null;

  try {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ success: false, error: 'No file uploaded', steps: ['No file data received'] });
    }
    steps.push('Received backup file (' + (req.body.length / 1024 / 1024).toFixed(1) + ' MB)');

    // Stop gateway if running
    if (isGatewayRunning()) {
      steps.push('Stopping gateway...');
      await stopGateway();
      steps.push('Gateway stopped');
    }

    // Create auto-backup
    steps.push('Creating auto-backup...');
    autoBackupPath = await createAutoBackup();
    steps.push('Auto-backup saved: ' + autoBackupPath);

    // Detect file type from filename header or magic bytes
    const filename = (req.headers['x-filename'] || '').toLowerCase();
    const isZip = filename.endsWith('.zip') ||
      (req.body.length >= 4 && req.body[0] === 0x50 && req.body[1] === 0x4B);

    // Write uploaded file to temp
    const ext = isZip ? '.zip' : '.tar.gz';
    const tempPath = join(tmpdir(), `openclaw-restore-${Date.now()}${ext}`);
    writeFileSync(tempPath, req.body);
    steps.push(`Wrote upload to temp file (${isZip ? 'zip' : 'tar.gz'})`);

    // Extract — backup contains .openclaw/ prefix, extract to parent of state dir
    const dataDir = join(OPENCLAW_STATE_DIR, '..');
    try {
      if (isZip) {
        const zip = await JSZip.loadAsync(req.body);
        for (const [relativePath, entry] of Object.entries(zip.files)) {
          if (entry.dir) {
            mkdirSync(join(dataDir, relativePath), { recursive: true });
            continue;
          }
          const outPath = join(dataDir, relativePath);
          mkdirSync(join(outPath, '..'), { recursive: true });
          const content = await entry.async('nodebuffer');
          writeFileSync(outPath, content);
        }
      } else {
        const extractResult = await runExec('tar', ['-xzf', tempPath, '-C', dataDir]);
        if (extractResult.code !== 0) {
          throw new Error(extractResult.stderr || 'tar extract failed');
        }
      }
      steps.push('Extracted backup to ' + dataDir);
    } catch (extractErr) {
      steps.push('Extract failed: ' + extractErr.message);
      // Rollback from auto-backup
      steps.push('Rolling back from auto-backup...');
      try {
        await runExec('tar', ['-xzf', autoBackupPath, '-C', dataDir]);
        steps.push('Rollback successful');
      } catch (rollbackErr) {
        steps.push('Rollback failed: ' + rollbackErr.message);
      }
      // Restart gateway with old config
      try {
        await startGateway();
        steps.push('Gateway restarted');
      } catch { steps.push('Gateway restart failed'); }
      return res.json({ success: false, error: 'Extract failed, rolled back', steps, autoBackupPath });
    }

    // Restart gateway
    steps.push('Starting gateway...');
    try {
      await startGateway();
      steps.push('Gateway started');
    } catch (startErr) {
      steps.push('Gateway start failed: ' + startErr.message);
    }

    res.json({ success: true, steps, autoBackupPath });
  } catch (error) {
    steps.push('Error: ' + error.message);
    // Try to restart gateway
    try { await startGateway(); steps.push('Gateway restarted'); } catch { /* ignore */ }
    res.status(500).json({ success: false, error: error.message, steps, autoBackupPath });
  }
});

// Lite API: Upgrade OpenClaw
app.post('/lite/api/upgrade', authMiddleware, async (req, res) => {
  const steps = [];
  let autoBackupPath = null;
  // Accept version from body: { version: "2026.2.21" } or { version: "base" } or omit for latest
  const requestedVersion = req.body?.version || 'latest';
  const isRevert = requestedVersion === 'base';

  try {
    if (isRevert) {
      // Revert to Docker-baked version by removing npm-installed version
      const npmPrefix = process.env.NPM_CONFIG_PREFIX || '/data/.npm-global';
      const npmModulePath = join(npmPrefix, 'lib', 'node_modules', 'openclaw');
      const npmBinPath = join(npmPrefix, 'bin', 'openclaw');

      if (!existsSync(join(npmModulePath, 'dist', 'entry.js'))) {
        return res.json({ success: true, steps: ['Already using Docker base version'], newVersion: null });
      }

      steps.push('Reverting to Docker base version...');

      // Stop gateway
      if (isGatewayRunning()) {
        steps.push('Stopping gateway...');
        await stopGateway();
        steps.push('Gateway stopped');
      }

      // Create auto-backup
      steps.push('Creating auto-backup...');
      autoBackupPath = await createAutoBackup();
      steps.push('Auto-backup saved: ' + autoBackupPath);

      // Remove npm-installed openclaw
      steps.push('Removing npm-installed openclaw...');
      try {
        const { rmSync: rm } = await import('node:fs');
        rm(npmModulePath, { recursive: true, force: true });
        try { rm(npmBinPath, { force: true }); } catch { /* might not exist */ }
        steps.push('Removed npm openclaw module');
      } catch (rmErr) {
        steps.push('Remove failed: ' + rmErr.message);
        try { await startGateway(); steps.push('Gateway restarted'); } catch { steps.push('Gateway restart failed'); }
        return res.json({ success: false, error: 'Failed to remove npm version', steps, autoBackupPath });
      }

      // Verify base version is now active
      const verifyResult = await runCmd('--version');
      const versionOut = (verifyResult.stdout || '').trim().replace(/^openclaw\s*/i, '');
      const newVersion = versionOut.split(/\s/)[0] || '';
      steps.push('Active version: ' + (newVersion || 'unknown'));

      // Restart gateway
      steps.push('Starting gateway...');
      try {
        await startGateway();
        steps.push('Gateway started');
      } catch (startErr) {
        steps.push('Gateway start failed: ' + startErr.message);
      }

      return res.json({ success: true, steps, autoBackupPath, newVersion });
    }

    // Install specific version or latest
    const versionSpec = requestedVersion === 'latest' ? 'latest' : requestedVersion;

    // Check if npm package exists
    steps.push('Checking npm registry...');
    const npmCheck = await runExec('npm', ['view', `openclaw@${versionSpec}`, 'version']);
    if (npmCheck.code !== 0 || !npmCheck.stdout.trim()) {
      return res.json({
        success: false,
        error: `openclaw@${versionSpec} not found. Redeploy on Railway to update.`,
        upgradeMethod: 'redeploy',
        steps: [`npm package openclaw@${versionSpec} not available`, 'Redeploy your Railway service to get the desired version']
      });
    }
    const targetVersion = npmCheck.stdout.trim();
    steps.push('Target version: ' + targetVersion);

    // Stop gateway
    if (isGatewayRunning()) {
      steps.push('Stopping gateway...');
      await stopGateway();
      steps.push('Gateway stopped');
    }

    // Create auto-backup
    steps.push('Creating auto-backup...');
    autoBackupPath = await createAutoBackup();
    steps.push('Auto-backup saved: ' + autoBackupPath);

    // Install requested version
    steps.push(`Installing openclaw@${versionSpec}...`);
    const installResult = await runExec('npm', ['install', '-g', `openclaw@${versionSpec}`]);
    if (installResult.code !== 0) {
      steps.push('Install failed: ' + (installResult.stderr || 'unknown error'));
      // Restart gateway with old version
      try { await startGateway(); steps.push('Gateway restarted with old version'); } catch { steps.push('Gateway restart failed'); }
      return res.json({ success: false, error: 'npm install failed', steps, autoBackupPath });
    }
    steps.push('Install completed');

    // Verify new version
    const verifyResult = await runCmd('--version');
    const versionOut = (verifyResult.stdout || '').trim().replace(/^openclaw\s*/i, '');
    const newVersion = versionOut.split(/\s/)[0] || '';
    steps.push('New version: ' + (newVersion || 'unknown'));

    // Restart gateway
    steps.push('Starting gateway...');
    try {
      await startGateway();
      steps.push('Gateway started');
    } catch (startErr) {
      steps.push('Gateway start failed: ' + startErr.message);
    }

    res.json({ success: true, steps, autoBackupPath, newVersion });
  } catch (error) {
    steps.push('Error: ' + error.message);
    try { await startGateway(); steps.push('Gateway restarted'); } catch { /* ignore */ }
    res.status(500).json({ success: false, error: error.message, steps, autoBackupPath });
  }
});

// API: Serve schemas + form metadata for client-side validation and form generation
app.get('/api/schemas', authMiddleware, (req, res) => {
  res.json(getAllSchemas());
});

// Create reverse proxy
const { middleware: proxyMiddleware, upgradeHandler } = createProxy(getGatewayToken);

// Protect all /openclaw paths (SPA, assets, API) with setup password
app.use('/openclaw', authMiddleware);

// Redirect /openclaw (and subpaths on refresh) to include gateway token so the SPA can authenticate.
// v2026.3.13+ reads the token from URL fragment (#token=xxx), not query params.
// We keep ?token= in the query as a loop-breaker (fragments aren't sent to the server)
// and for backward compat with older SPA versions.
const openclawHandler = (req, res, next) => {
  // If token already in query, let the proxy serve the request (prevents redirect loop)
  if (req.query.token) {
    return next();
  }
  // Only redirect navigation requests (HTML pages), not assets/API/XHR
  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  if (!acceptsHtml) {
    return next();
  }
  if (!isGatewayRunning()) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'OpenClaw gateway is not running. Visit /onboard to start it.'
    });
  }
  const token = getGatewayToken();
  // Preserve existing query params (e.g. ?session=...) and add token
  const url = new URL(req.originalUrl, `http://${req.headers.host}`);
  url.searchParams.set('token', token);
  // Append token as URL fragment for v2026.3.13+ SPA (reads #token=<value>, stores in sessionStorage)
  res.redirect(url.pathname + url.search + '#token=' + encodeURIComponent(token));
};

app.get('/openclaw', openclawHandler);
app.post('/openclaw', openclawHandler);
app.get('/openclaw/{*path}', openclawHandler);  // catch subpath refreshes like /openclaw/chat?session=...

// Proxy all other requests to gateway (when running)
// Note: Using no path argument to avoid Express 5 stripping req.url
// (/{*path} would set req.url to "/" for every request, breaking the proxy)
app.use((req, res, next) => {
  if (!isGatewayRunning()) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'OpenClaw gateway is not running. Visit /onboard to start it.'
    });
  }
  proxyMiddleware(req, res);
});

// Create HTTP server
const server = createServer(app);

// Initialize terminal WebSocket server (handles /onboard/ws endpoint)
createTerminalServer(server, SETUP_PASSWORD);

// Handle WebSocket upgrades for gateway proxy
// Note: Terminal WebSocket upgrades are handled by createTerminalServer
server.on('upgrade', (req, socket, head) => {
  // Skip health check endpoints
  if (req.url.startsWith('/health')) {
    socket.destroy();
    return;
  }

  // Skip terminal endpoints (handled by terminal server)
  if (req.url.startsWith('/onboard/ws') || req.url.startsWith('/lite/ws')) {
    return; // Already handled by createTerminalServer
  }

  // Proxy WebSocket to gateway if running
  if (!isGatewayRunning()) {
    socket.destroy();
    return;
  }

  upgradeHandler(req, socket, head);
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  // Close terminal sessions
  closeAllSessions();

  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Stop gateway
  await stopGateway();

  console.log('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`OpenClaw wrapper server listening on port ${PORT}`);
  console.log(`Setup wizard: http://localhost:${PORT}/onboard`);
  console.log(`Lite panel: http://localhost:${PORT}/lite`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Check if gateway should auto-start (if already configured)
  const configFile = join(OPENCLAW_STATE_DIR, 'openclaw.json');
  if (existsSync(configFile)) {
    console.log('Configuration found, auto-starting gateway...');
    startGateway().catch(err => {
      console.error('Failed to auto-start gateway:', err.message);
    });
  } else {
    console.log('No configuration found. Visit /onboard to configure OpenClaw.');
  }
});
