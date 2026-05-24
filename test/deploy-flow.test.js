/**
 * Layer 3: E2E deploy flow tests
 *
 * Spawns the real server with mock CLI and exercises the full
 * POST /onboard/api/run -> mock CLI -> config file pipeline.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHANNEL_GROUPS } from '../src/channels.js';
import { CHANNEL_FIXTURES } from './helpers/fixtures.js';
import { startServer } from './helpers/server-harness.js';

let server;

/**
 * POST JSON to the server with auth.
 */
async function postRun(port, body) {
  const res = await fetch(`http://127.0.0.1:${port}/onboard/api/run?password=test-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Read and parse the openclaw.json config file from the state dir.
 */
function readConfig(stateDir) {
  const raw = readFileSync(join(stateDir, 'openclaw.json'), 'utf-8');
  return JSON.parse(raw);
}

describe('E2E deploy flow', { timeout: 30000 }, () => {
  before(async () => {
    server = await startServer();
  });

  after(() => {
    server?.cleanup();
  });

  describe('deploy each channel individually', () => {
    for (const ch of CHANNEL_GROUPS) {
      it(`deploys ${ch.name} with correct config`, async () => {
        const fixture = CHANNEL_FIXTURES[ch.name];

        const result = await postRun(server.port, {
          authChoice: 'anthropic-api-key',
          authSecret: 'sk-test-key',
          channels: [{ name: ch.name, fields: fixture }],
        });

        assert.equal(result.success, true, `Deploy failed for ${ch.name}: ${JSON.stringify(result.logs)}`);

        // Verify deploy logs contain the "Configured channel:" message
        const configuredMsg = `Configured channel: ${ch.name}`;
        assert.ok(
          result.logs.some(l => l.includes(configuredMsg)),
          `Logs should contain "${configuredMsg}" but got: ${JSON.stringify(result.logs)}`
        );

        const config = readConfig(server.stateDir);
        const channelConfig = config.channels?.[ch.name];

        assert.ok(channelConfig, `channels.${ch.name} missing from config file`);
        assert.equal(channelConfig.enabled, true);
        assert.equal(channelConfig.dmPolicy, 'open');

        // Verify all fixture field values are present
        for (const [key, val] of Object.entries(fixture || {})) {
          if (!val) continue;
          if (ch.name === 'irc' && key === 'channels') {
            // IRC channels should be converted to array
            assert.ok(Array.isArray(channelConfig.channels), 'IRC channels should be an array');
            assert.deepEqual(
              channelConfig.channels,
              val.split(',').map(s => s.trim()).filter(Boolean)
            );
          } else {
            assert.equal(channelConfig[key], val, `${ch.name}.${key} mismatch`);
          }
        }
      });
    }
  });

  describe('deploy multiple channels at once', () => {
    it('deploys telegram + discord + slack in one request', async () => {
      const channels = ['telegram', 'discord', 'slack'].map(name => ({
        name,
        fields: CHANNEL_FIXTURES[name],
      }));

      const result = await postRun(server.port, {
        authChoice: 'anthropic-api-key',
        authSecret: 'sk-test-key',
        channels,
      });

      assert.equal(result.success, true, `Multi-deploy failed: ${JSON.stringify(result.logs)}`);

      // Verify deploy logs contain "Configured channel:" for each channel
      for (const name of ['telegram', 'discord', 'slack']) {
        const configuredMsg = `Configured channel: ${name}`;
        assert.ok(
          result.logs.some(l => l.includes(configuredMsg)),
          `Logs should contain "${configuredMsg}" but got: ${JSON.stringify(result.logs)}`
        );
      }

      const config = readConfig(server.stateDir);

      for (const name of ['telegram', 'discord', 'slack']) {
        const channelConfig = config.channels?.[name];
        assert.ok(channelConfig, `channels.${name} missing after multi-deploy`);
        assert.equal(channelConfig.enabled, true);
        assert.equal(channelConfig.dmPolicy, 'open');
      }

      // Verify specific field values
      assert.equal(config.channels.telegram.botToken, CHANNEL_FIXTURES.telegram.botToken);
      assert.equal(config.channels.discord.token, CHANNEL_FIXTURES.discord.token);
      assert.equal(config.channels.slack.botToken, CHANNEL_FIXTURES.slack.botToken);
      assert.equal(config.channels.slack.appToken, CHANNEL_FIXTURES.slack.appToken);
    });
  });

  describe('device-code auth choice', () => {
    // Device pairing (ChatGPT/Codex) happens interactively in the PTY terminal with
    // --skip-channels --skip-skills. The front-end then calls /onboard/api/run with the
    // device-code choice to apply the wizard's channels/skills to the already-paired config,
    // WITHOUT re-running onboard auth.
    it('applies channels to the paired config without re-running auth', async () => {
      // The earlier deploy tests already wrote a config into server.stateDir, standing in
      // for the config the pairing terminal would have created.
      const fixture = CHANNEL_FIXTURES['telegram'];
      const res = await postRun(server.port, {
        authChoice: 'openai-codex-device-code',
        channels: [{ name: 'telegram', fields: fixture }],
        skills: [],
      });

      assert.equal(res.success, true, `expected success, got: ${JSON.stringify(res.logs)}`);
      assert.ok(
        res.logs.join(' ').toLowerCase().includes('device pairing detected'),
        `expected a device-pairing-detected log, got: ${JSON.stringify(res.logs)}`
      );
      // No onboard auth command should have been run for the device-code choice.
      assert.ok(
        !res.logs.join(' ').includes('> openclaw onboard '),
        `device-code path must not re-run onboard, got: ${JSON.stringify(res.logs)}`
      );
      const config = readConfig(server.stateDir);
      assert.ok(config.channels?.telegram, 'telegram channel should be configured');
      assert.equal(config.channels.telegram.enabled, true);
    });

    it('reports pairing-needed when no config exists yet (fresh instance)', async () => {
      const fresh = await startServer();
      try {
        const res = await fetch(
          `http://127.0.0.1:${fresh.port}/onboard/api/run?password=test-password`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authChoice: 'openai-codex-device-code', channels: [], skills: [] }),
          }
        );
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, false);
        assert.ok(
          body.logs.join(' ').toLowerCase().includes('pairing'),
          `expected a pairing-needed message, got: ${JSON.stringify(body.logs)}`
        );
      } finally {
        fresh.cleanup();
      }
    });
  });
});
