/**
 * Guards the AI-provider onboarding contract.
 *
 * Every option in AUTH_GROUPS must emit an EXPLICIT, canonical `--auth-choice`
 * (the upstream OpenClaw plugin manifest `choiceId`) — never rely on onboard's
 * bare-credential-flag inference, which can resolve a shared flag to the wrong
 * provider (e.g. `--openai-api-key` -> `openai-codex-api-key`).
 *
 * CANONICAL_CHOICE_IDS is verified against the manifests in
 * openclaw/openclaw @ a4ef3a2c (extensions/<id>/openclaw.plugin.json). When you
 * add or change a provider option, confirm its choiceId here against the manifest.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_GROUPS, AUTH_OPTION_MAP } from '../src/auth-groups.js';

// Canonical upstream choiceId for every auth-choice we may emit.
const CANONICAL_CHOICE_IDS = new Set([
  'apiKey',                          // Anthropic API key
  'setup-token',                     // Anthropic Claude Pro/Max subscription token
  'openai-api-key',                  // OpenAI (platform.openai.com)
  'openai-codex-device-code',        // OpenAI ChatGPT/Codex subscription (PTY device pairing)
  'gemini-api-key',                  // Google / Gemini
  'openrouter-api-key',              // OpenRouter
  'minimax-global-api',              // MiniMax (global endpoint)
  'venice-api-key',                  // Venice AI
  'together-api-key',                // Together AI
  'ai-gateway-api-key',              // Vercel AI Gateway
  'moonshot-api-key',                // Moonshot AI
  'kimi-code-api-key',               // Kimi Coding
  'zai-api-key',                     // Z.AI (GLM)
  'cloudflare-ai-gateway-api-key',   // Cloudflare AI Gateway
  'opencode-zen',                    // OpenCode Zen
  'ollama',                          // Ollama (local/remote)
  'custom-api-key',                  // Custom OpenAI/Anthropic-compatible endpoint
]);

/**
 * The --auth-choice value this option causes onboard to run with.
 * - array flag: the token after '--auth-choice'
 * - deviceCode option: run via the PTY terminal as `--auth-choice <value>`
 * - anything else (bare string flag / null): null = relies on inference (disallowed)
 */
function emittedAuthChoice(opt) {
  if (Array.isArray(opt.flag)) {
    const i = opt.flag.indexOf('--auth-choice');
    if (i >= 0 && i + 1 < opt.flag.length) return opt.flag[i + 1];
    return null;
  }
  if (opt.deviceCode) return opt.value;
  return null;
}

const allOptions = AUTH_GROUPS.flatMap((g) => g.options.map((o) => ({ provider: g.provider, ...o })));

describe('AUTH_GROUPS provider auth contract', () => {
  it('has at least one option per provider group', () => {
    for (const group of AUTH_GROUPS) {
      assert.ok(Array.isArray(group.options) && group.options.length > 0,
        `${group.provider} has no options`);
    }
  });

  it('every option emits an explicit --auth-choice (no bare-flag inference)', () => {
    for (const opt of allOptions) {
      const choice = emittedAuthChoice(opt);
      assert.ok(
        choice,
        `${opt.provider} / "${opt.label}" (value=${opt.value}) does not emit an explicit ` +
        `--auth-choice. Bare credential flags rely on onboard inference and can bind to the ` +
        `wrong provider — use flag: ['--auth-choice', '<choiceId>'] (or deviceCode for PTY flows).`
      );
    }
  });

  it('every emitted --auth-choice is a canonical upstream choiceId', () => {
    for (const opt of allOptions) {
      const choice = emittedAuthChoice(opt);
      assert.ok(
        CANONICAL_CHOICE_IDS.has(choice),
        `${opt.provider} / "${opt.label}" emits --auth-choice "${choice}", which is not a ` +
        `canonical OpenClaw choiceId. Verify against the provider's plugin manifest and update ` +
        `CANONICAL_CHOICE_IDS if upstream genuinely changed.`
      );
    }
  });

  it('array-flag options put the choiceId immediately after --auth-choice', () => {
    for (const opt of allOptions) {
      if (!Array.isArray(opt.flag)) continue;
      assert.equal(opt.flag[0], '--auth-choice',
        `${opt.provider} / "${opt.label}" flag should start with --auth-choice`);
      assert.ok(CANONICAL_CHOICE_IDS.has(opt.flag[1]),
        `${opt.provider} / "${opt.label}" flag[1] should be a canonical choiceId`);
    }
  });

  it('secret-bearing options declare a credential flag; noSecret/deviceCode do not need one', () => {
    for (const opt of allOptions) {
      if (opt.noSecret || opt.deviceCode) continue;
      assert.ok(
        typeof opt.secretFlag === 'string' && opt.secretFlag.startsWith('--'),
        `${opt.provider} / "${opt.label}" must declare a secretFlag (e.g. --anthropic-api-key)`
      );
    }
  });

  it('AUTH_OPTION_MAP indexes every option by value', () => {
    for (const opt of allOptions) {
      assert.equal(AUTH_OPTION_MAP[opt.value]?.value, opt.value,
        `AUTH_OPTION_MAP missing entry for ${opt.value}`);
    }
  });

  it('does not offer the removed MiniMax OAuth (interactive-only) option', () => {
    assert.equal(AUTH_OPTION_MAP['minimax-portal'], undefined,
      'minimax-portal OAuth cannot complete non-interactively and must not be offered');
  });
});
