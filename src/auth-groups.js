/**
 * AI provider auth groups for the onboarding "simple mode" form.
 *
 * Each option's `flag`/`secretFlag` is translated by /onboard/api/run into an
 * `openclaw onboard --non-interactive …` command. Every option emits an explicit,
 * canonical `--auth-choice` (the upstream plugin manifest `choiceId`) rather than
 * relying on onboard's bare-flag inference — see auth-groups.test.js for the
 * allow-list of valid choiceIds verified against the OpenClaw manifests.
 *
 * Kept in its own module (no server/runtime deps) so it can be unit-tested directly.
 * server.js enriches each group with an `icon` after import.
 */
export const AUTH_GROUPS = [
  // === Popular ===
  {
    provider: 'Anthropic',
    category: 'popular',
    description: 'Claude Opus, Sonnet, Haiku',
    emoji: '\u{1F9E0}',
    options: [
      { label: 'API Key', value: 'anthropic-api-key',
        flag: ['--auth-choice', 'apiKey'],
        secretFlag: '--anthropic-api-key',
        hint: 'Direct API access, billed per-token (console.anthropic.com)' },
      { label: 'Setup Token', value: 'setup-token',
        flag: ['--auth-choice', 'setup-token', '--token-provider', 'anthropic'],
        secretFlag: '--token',
        hint: 'Use your Claude Pro/Max subscription (paste a setup token)' }
    ]
  },
  {
    provider: 'OpenAI',
    category: 'popular',
    description: 'GPT-4o, o1, o3, DALL-E',
    emoji: '\u{1F916}',
    options: [
      // Must pass --auth-choice explicitly: the bare --openai-api-key flag is shared by both
      // the 'openai-api-key' and 'openai-codex-api-key' choices (same optionKey), and onboard's
      // inference resolves the duplicate to 'openai-codex-api-key' (the chatgpt.com Codex
      // endpoint) — wrong for a plain platform.openai.com key. See upstream
      // provider-auth-choices.ts dedupe (first-wins) + openai.json choice ordering.
      { label: 'OpenAI API Key', value: 'openai-api-key',
        flag: ['--auth-choice', 'openai-api-key'],
        secretFlag: '--openai-api-key',
        hint: 'Direct API access, billed per-token (platform.openai.com)' },
      // ChatGPT/Codex subscription via device-code pairing.
      // The plain 'openai-codex' (browser loopback redirect) cannot work on a headless
      // Railway container — it requires a local browser + localhost callback. The device-code
      // flow prints a URL + code that the user approves in their own browser while the
      // container polls. It is interactive-only (refuses --non-interactive), so it runs
      // through the PTY terminal (see deviceCode handling in onboard-page.js / terminal.js),
      // NOT the non-interactive /onboard/api/run path.
      { label: 'Codex Subscription (Device Pairing)', value: 'openai-codex-device-code',
        deviceCode: true,
        noSecret: true,
        hint: 'Use your ChatGPT/Codex plan — sign in with a code, no key' }
      // Note: the advanced "openai-codex-api-key" backup (an OpenAI API key used as a
      // fallback for the Codex subscription) is intentionally omitted here — OpenClaw marks
      // it manual-only and it's confusing as a standalone choice. Add it post-setup via the
      // terminal if needed: openclaw onboard --auth-choice openai-codex-api-key --openai-codex-api-key <key>
    ]
  },
  {
    provider: 'Google / Gemini',
    category: 'popular',
    description: 'Gemini Pro, Flash, Ultra',
    emoji: '\u{2728}',
    options: [
      { label: 'API Key', value: 'gemini-api-key',
        flag: ['--auth-choice', 'gemini-api-key'],
        secretFlag: '--gemini-api-key' }
    ]
  },
  {
    provider: 'OpenRouter',
    category: 'popular',
    description: 'Multi-provider gateway',
    emoji: '\u{1F310}',
    options: [
      { label: 'API Key', value: 'openrouter-api-key',
        flag: ['--auth-choice', 'openrouter-api-key'],
        secretFlag: '--openrouter-api-key' }
    ]
  },
  // === More Providers ===
  {
    provider: 'MiniMax',
    category: 'more',
    description: 'MiniMax M2.1 models',
    emoji: '\u{1F4A1}',
    options: [
      { label: 'API Key', value: 'minimax-api-key',
        flag: ['--auth-choice', 'minimax-global-api'],
        secretFlag: '--minimax-api-key',
        hint: 'Direct API access with a MiniMax API key (global endpoint)' }
      // The MiniMax "Coding Plan (OAuth)" option was removed: its only upstream methods are
      // 'minimax-global-oauth' / 'minimax-cn-oauth' (no credential flag, no device-code variant),
      // i.e. an interactive browser login that cannot complete through the non-interactive
      // /onboard/api/run endpoint. Use the API Key path instead.
    ]
  },
  {
    provider: 'Venice AI',
    category: 'more',
    description: 'Privacy-focused AI inference',
    emoji: '\u{1F3AD}',
    options: [
      { label: 'API Key', value: 'venice-api-key',
        flag: ['--auth-choice', 'venice-api-key'],
        secretFlag: '--venice-api-key' }
    ]
  },
  {
    provider: 'Together AI',
    category: 'more',
    description: 'Open-source model hosting',
    emoji: '\u{1F91D}',
    options: [
      { label: 'API Key', value: 'together-api-key',
        flag: ['--auth-choice', 'together-api-key'],
        secretFlag: '--together-api-key' }
    ]
  },
  {
    provider: 'Vercel AI Gateway',
    category: 'more',
    description: 'Edge AI inference gateway',
    emoji: '▲',
    options: [
      { label: 'API Key', value: 'ai-gateway-api-key',
        flag: ['--auth-choice', 'ai-gateway-api-key'],
        secretFlag: '--ai-gateway-api-key' }
    ]
  },
  {
    provider: 'Moonshot AI',
    category: 'more',
    description: 'Kimi large language models',
    emoji: '\u{1F319}',
    options: [
      { label: 'API Key', value: 'moonshot-api-key',
        flag: ['--auth-choice', 'moonshot-api-key'],
        secretFlag: '--moonshot-api-key' }
    ]
  },
  {
    provider: 'Kimi Coding',
    category: 'more',
    description: 'AI-powered code assistant',
    emoji: '\u{1F4BB}',
    options: [
      { label: 'API Key', value: 'kimi-code-api-key',
        flag: ['--auth-choice', 'kimi-code-api-key'],
        secretFlag: '--kimi-code-api-key' }
    ]
  },
  {
    provider: 'Z.AI (GLM)',
    category: 'more',
    description: 'Zhipu GLM series models',
    emoji: '\u{1F4A0}',
    options: [
      { label: 'API Key', value: 'zai-api-key',
        flag: ['--auth-choice', 'zai-api-key'],
        secretFlag: '--zai-api-key' }
    ]
  },
  {
    provider: 'Cloudflare AI Gateway',
    category: 'more',
    description: 'Edge AI inference gateway',
    emoji: '☁️',
    options: [
      { label: 'API Key + IDs', value: 'cloudflare-ai-gateway-api-key',
        flag: ['--auth-choice', 'cloudflare-ai-gateway-api-key'],
        secretFlag: '--cloudflare-ai-gateway-api-key',
        extraFields: [
          { id: 'cf-account-id', label: 'Account ID', flag: '--cloudflare-ai-gateway-account-id', placeholder: 'Cloudflare account ID' },
          { id: 'cf-gateway-id', label: 'Gateway ID', flag: '--cloudflare-ai-gateway-gateway-id', placeholder: 'AI Gateway ID' }
        ]
      }
    ]
  },
  {
    provider: 'OpenCode Zen',
    category: 'more',
    description: 'Claude, GPT and more via Zen',
    emoji: '\u{26A1}',
    options: [
      // Canonical upstream choiceId is 'opencode-zen' (not 'opencode-zen-api-key', which is only
      // our internal selector value); the credential flag is '--opencode-zen-api-key'.
      { label: 'API Key', value: 'opencode-zen-api-key',
        flag: ['--auth-choice', 'opencode-zen'],
        secretFlag: '--opencode-zen-api-key' }
    ]
  },
  {
    provider: 'Ollama',
    category: 'more',
    description: 'Run models locally',
    emoji: '\u{1F999}',
    options: [
      // Ollama has no API key (choiceId 'ollama', method 'local'); it can't be inferred from a
      // bare flag, so --auth-choice ollama is required. The base URL + model id reuse the shared
      // --custom-base-url / --custom-model-id flags (per upstream docs).
      { label: 'Base URL + Model', value: 'ollama',
        flag: ['--auth-choice', 'ollama'],
        noSecret: true,
        extraFields: [
          { id: 'ollama-base-url', label: 'Base URL', flag: '--custom-base-url', placeholder: 'http://ollama.railway.internal:11434' },
          { id: 'ollama-model-id', label: 'Model ID', flag: '--custom-model-id', placeholder: 'qwen3:8b' }
        ]
      }
    ]
  },
  {
    provider: 'Custom Provider',
    category: 'more',
    description: 'Any OpenAI-compatible API',
    emoji: '\u{1F527}',
    options: [
      {
        label: 'API Key + Base URL',
        value: 'custom-api-key',
        flag: ['--auth-choice', 'custom-api-key', '--custom-compatibility', 'openai'],
        secretFlag: '--custom-api-key',
        secretOptional: true,
        extraFields: [
          { id: 'custom-base-url', label: 'Base URL', flag: '--custom-base-url', placeholder: 'https://api.example.com/v1' },
          { id: 'custom-model-id', label: 'Model ID', flag: '--custom-model-id', placeholder: 'openai/gpt-4o', hint: 'For Plano/litellm, use provider/model format (e.g. openai/gpt-4o, anthropic/claude-sonnet-4-5)' },
          { id: 'custom-provider-name', label: 'Provider Name', placeholder: 'e.g. Plano, LocalAI', optional: true, noFlag: true },
          { id: 'custom-context-window', label: 'Context Window', placeholder: '200000', optional: true, noFlag: true, type: 'number' }
        ]
      }
    ]
  }
];

// Flat lookup: auth choice value -> full option object (flag, secretFlag, etc.)
export const AUTH_OPTION_MAP = {};
for (const group of AUTH_GROUPS) {
  for (const opt of group.options) {
    AUTH_OPTION_MAP[opt.value] = opt;
  }
}
