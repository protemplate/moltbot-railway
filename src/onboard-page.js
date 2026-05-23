/**
 * Setup page HTML generator for OpenClaw
 *
 * Generates a simplified 5-step onboarding wizard:
 * Step 1: Welcome
 * Step 2: AI Provider
 * Step 3: Channels (optional)
 * Step 4: Skills (optional)
 * Step 5: Review & Deploy
 */

import { getLangSelectorCSS, getLangSelectorHTML, getI18nBootstrapJS } from './i18n.js';

/**
 * Generate the setup page HTML
 * @param {Object} options - Page options
 * @param {boolean} options.isConfigured - Whether OpenClaw is configured
 * @param {Object} options.gatewayInfo - Gateway process info
 * @param {string} options.password - Auth password for WebSocket
 * @param {string} options.stateDir - State directory path
 * @param {string} options.gatewayToken - Gateway auth token
 * @param {Array} options.authGroups - Auth provider groups for form
 * @returns {string} HTML content
 */
export function getSetupPageHTML({ isConfigured, gatewayInfo, password, stateDir, gatewayToken, authGroups, channelGroups }) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>OpenClaw Onboarding Wizard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg viewBox='0 0 120 120' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ff4d4d'/%3E%3Cstop offset='100%25' stop-color='%23991b1b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M60 10C30 10 15 35 15 55C15 75 30 95 45 100L45 110L55 110L55 100C55 100 60 102 65 100L65 110L75 110L75 100C90 95 105 75 105 55C105 35 90 10 60 10Z' fill='url(%23g)'/%3E%3Cpath d='M20 45C5 40 0 50 5 60C10 70 20 65 25 55C28 48 25 45 20 45Z' fill='url(%23g)'/%3E%3Cpath d='M100 45C115 40 120 50 115 60C110 70 100 65 95 55C92 48 95 45 100 45Z' fill='url(%23g)'/%3E%3Cpath d='M45 15Q35 5 30 8' stroke='%23ff4d4d' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M75 15Q85 5 90 8' stroke='%23ff4d4d' stroke-width='3' stroke-linecap='round'/%3E%3Ccircle cx='45' cy='35' r='6' fill='%23050810'/%3E%3Ccircle cx='75' cy='35' r='6' fill='%23050810'/%3E%3Ccircle cx='46' cy='34' r='2.5' fill='%2300e5cc'/%3E%3Ccircle cx='76' cy='34' r='2.5' fill='%2300e5cc'/%3E%3C/svg%3E"/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap"/>
  <style>
    :root {
      --bg: #12141a;
      --bg-accent: #14161d;
      --bg-elevated: #1a1d25;
      --bg-hover: #262a35;
      --card: #181b22;
      --card-foreground: #f4f4f5;
      --accent: #ff5c5c;
      --accent-hover: #ff7070;
      --accent-dark: #991b1b;
      --accent-subtle: rgba(255, 92, 92, 0.15);
      --accent-glow: rgba(255, 92, 92, 0.25);
      --teal: #14b8a6;
      --teal-bright: #00e5cc;
      --teal-glow: rgba(20, 184, 166, 0.4);
      --ok: #22c55e;
      --danger: #ef4444;
      --warn: #f59e0b;
      --text: #e4e4e7;
      --text-strong: #fafafa;
      --muted: #71717a;
      --muted-strong: #52525b;
      --border: #27272a;
      --border-strong: #3f3f46;
      --font-body: 'Space Grotesk', 'Noto Sans SC', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-display: 'Space Grotesk', 'Noto Sans SC', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.03);
      --duration-fast: 120ms;
      --duration-normal: 200ms;
    }
    ::selection {
      background: var(--accent-subtle);
      color: var(--text-strong);
    }
    * { box-sizing: border-box; }
    body {
      font-family: var(--font-body);
      margin: 0;
      padding: 20px;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      letter-spacing: -0.02em;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    a { color: var(--teal-bright); }
    a:hover { color: var(--teal); }

    /* Layout */
    .wizard-container {
      max-width: 680px;
      margin: 0 auto;
    }
    .wizard-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .wizard-header h1 {
      font-family: var(--font-display);
      color: var(--text-strong);
      margin: 0;
      font-weight: 600;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .wizard-header .logo { width: 28px; height: 28px; }

    /* Language Selector */
    .wizard-header { position: relative; }
    ${getLangSelectorCSS()}
    .wizard-header .lang-selector {
      position: absolute;
      top: 0;
      right: 0;
    }
    .configured-lang-selector {
      margin-bottom: 16px;
      display: inline-block;
      position: relative;
    }

    @media (max-width: 600px) {
      .lang-selector {
        position: static;
        text-align: center;
        margin-bottom: 12px;
      }
      .lang-dropdown {
        left: 50%;
        right: auto;
        transform: translateX(-50%);
      }
    }

    /* Step indicator */
    .wizard-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-bottom: 32px;
      padding: 0 10px;
    }
    .wizard-step {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .wizard-step.disabled { cursor: default; }
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 600;
      border: 2px solid var(--border-strong);
      color: var(--muted-strong);
      background: var(--bg);
      transition: all var(--duration-normal);
      flex-shrink: 0;
    }
    .wizard-step.active .step-circle {
      border-color: var(--accent);
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      color: #fff;
    }
    .wizard-step.completed .step-circle {
      border-color: var(--teal);
      background: var(--teal);
      color: #fff;
    }
    .step-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--muted-strong);
      transition: color var(--duration-normal);
    }
    .wizard-step.active .step-label { color: var(--text); }
    .wizard-step.completed .step-label { color: var(--teal-bright); }
    .step-connector {
      flex: 1;
      height: 2px;
      background: var(--border);
      margin: 0 8px;
      min-width: 20px;
      transition: background var(--duration-normal);
    }
    .step-connector.completed { background: var(--teal); }

    /* Step panels */
    .step-panel {
      display: none;
      animation: fadeIn 0.25s ease-out;
    }
    .step-panel.active { display: block; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card {
      background: var(--card);
      padding: 28px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
    }

    /* Navigation */
    .wizard-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
    }
    button, .btn {
      padding: 10px 22px;
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-body);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px var(--accent-glow);
      color: white;
    }
    .btn-secondary {
      background: var(--bg-elevated);
      color: var(--muted);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover:not(:disabled) {
      color: var(--text);
      border-color: var(--muted-strong);
    }
    .btn-deploy {
      background: linear-gradient(135deg, var(--teal) 0%, #0d9488 100%);
      color: white;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: var(--radius-md);
      width: 100%;
    }
    .btn-deploy:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px var(--teal-glow);
    }
    .btn-text {
      background: none;
      border: none;
      color: var(--muted);
      padding: 8px 0;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-text:hover { color: var(--accent); }

    /* ===================== Step 1: Welcome ===================== */
    .welcome-logo { width: 80px; height: 80px; margin-bottom: 16px; }
    .welcome-heading {
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 700;
      color: var(--text-strong);
      margin: 0 0 8px 0;
    }
    .welcome-sub {
      color: var(--muted);
      font-size: 15px;
      margin: 0 0 24px 0;
    }
    .welcome-steps {
      list-style: none;
      padding: 0;
      margin: 0 0 24px 0;
    }
    .welcome-steps li {
      padding: 8px 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text);
      font-size: 14px;
    }
    .welcome-steps li .step-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--accent-subtle);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .before-section {
      background: var(--bg-elevated);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      border: 1px solid var(--border);
    }
    .before-section h3 {
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 10px 0;
    }
    .key-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .key-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--teal-bright);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: border-color 0.2s, background 0.2s;
    }
    .key-link:hover {
      border-color: var(--teal);
      background: rgba(20, 184, 166, 0.05);
      color: var(--teal-bright);
    }

    /* ===================== Step 2: AI Provider ===================== */
    .provider-category-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 10px 0;
    }
    .provider-category-label:not(:first-child) {
      margin-top: 20px;
    }
    .provider-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }
    .provider-card {
      padding: 14px 12px;
      background: var(--bg-elevated);
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition: all 0.15s;
    }
    .provider-card:hover {
      border-color: var(--border-strong);
      background: var(--bg-hover);
    }
    .provider-card.selected {
      border-color: var(--accent);
      background: var(--accent-subtle);
    }
    .provider-icon {
      width: 22px;
      height: 22px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
    }
    .provider-icon svg {
      width: 20px;
      height: 20px;
    }
    .provider-icon .emoji-fallback {
      font-size: 20px;
      line-height: 1;
    }
    .provider-card .provider-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--text);
    }
    .provider-card.selected .provider-name { color: var(--text-strong); }
    .provider-desc {
      font-size: 11px;
      color: var(--muted-strong);
      line-height: 1.3;
    }
    .extra-fields-container {
      margin-top: 12px;
    }
    .extra-fields-container .form-group {
      margin-bottom: 12px;
    }
    .extra-fields-container .form-group:last-child {
      margin-bottom: 0;
    }
    .auth-methods {
      margin-bottom: 16px;
    }
    .auth-methods label.auth-methods-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--muted);
      display: block;
      margin-bottom: 8px;
    }
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .radio-option {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: var(--text);
    }
    .radio-option input[type="radio"] {
      accent-color: var(--accent);
      width: 16px;
      height: 16px;
      margin-top: 1px;
      cursor: pointer;
      flex: none;
    }
    .radio-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .radio-label {
      font-size: 14px;
      color: var(--text);
    }
    .radio-hint {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.3;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-label {
      display: block;
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .form-input, .form-select {
      width: 100%;
      padding: 10px 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      font-size: 14px;
      font-family: var(--font-body);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
    }
    .form-select option {
      background: var(--bg-elevated);
      color: var(--text);
    }
    .form-hint {
      color: var(--muted-strong);
      font-size: 12px;
      margin-top: 4px;
    }
    .form-hint a { color: var(--teal-bright); text-decoration: none; }
    .form-hint a:hover { text-decoration: underline; }
    .inline-error {
      color: var(--accent);
      font-size: 13px;
      margin-top: 6px;
      display: none;
    }
    .inline-error.show { display: block; }

    /* ===================== Step 3: Channels ===================== */
    .channels-desc {
      color: var(--muted);
      font-size: 14px;
      margin: 0 0 20px 0;
    }
    .channel-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .channel-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .channel-card.enabled { border-color: var(--teal); }
    .channel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      user-select: none;
    }
    .channel-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .channel-icon {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    .channel-icon svg {
      width: 20px;
      height: 20px;
    }
    .channel-icon .emoji-fallback {
      font-size: 20px;
      line-height: 1;
    }
    .channel-category-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 10px 0;
    }
    .channel-category-label:not(:first-child) {
      margin-top: 20px;
    }
    .plugin-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      color: var(--warn);
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 4px;
      padding: 1px 6px;
      margin-left: 8px;
      vertical-align: middle;
    }
    .channel-note {
      font-size: 12px;
      color: var(--muted);
      font-style: italic;
      margin-top: 4px;
    }
    .channel-name-text {
      font-weight: 600;
      font-size: 14px;
      color: var(--text);
    }
    /* Toggle switch */
    .toggle-switch {
      position: relative;
      width: 42px;
      height: 24px;
      flex-shrink: 0;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--muted-strong);
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .toggle-slider::before {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      bottom: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }
    .toggle-switch input:checked + .toggle-slider {
      background: var(--teal);
    }
    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(18px);
    }
    .channel-body {
      display: none;
      padding: 0 16px 16px;
    }
    .channel-card.enabled .channel-body { display: block; }
    .channel-help {
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
    }
    .channel-help a { color: var(--teal-bright); text-decoration: none; }
    .channel-help a:hover { text-decoration: underline; }

    /* ===================== Step 4: Skills ===================== */
    .skills-desc {
      color: var(--muted);
      font-size: 14px;
      margin: 0 0 20px 0;
    }
    .skill-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .skill-card {
      padding: 16px;
      background: var(--bg-elevated);
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
      position: relative;
    }
    .skill-card:hover { border-color: var(--border-strong); background: var(--bg-hover); }
    .skill-card.selected { border-color: var(--teal); background: rgba(20, 184, 166, 0.08); }
    .skill-card.selected::after {
      content: '\\2713';
      position: absolute;
      top: 6px;
      right: 8px;
      font-size: 12px;
      font-weight: 700;
      color: var(--teal);
    }
    .skill-emoji { font-size: 28px; margin-bottom: 6px; }
    .skill-name { font-weight: 600; font-size: 13px; color: var(--text); }
    .skill-desc { font-size: 11px; color: var(--muted-strong); margin-top: 2px; }
    .skill-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      color: var(--teal-bright);
      background: rgba(20, 184, 166, 0.12);
      border: 1px solid rgba(20, 184, 166, 0.25);
      border-radius: 4px;
      padding: 1px 6px;
      margin-top: 4px;
    }
    .skill-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .skill-section-header h4 {
      margin: 0;
    }
    .skill-section-header a {
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
    }
    .skill-section-header a:hover { text-decoration: underline; }
    .skill-search {
      width: 100%;
      padding: 10px 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text);
      font-size: 14px;
      font-family: var(--font-body);
      transition: border-color 0.2s, box-shadow 0.2s;
      margin-bottom: 10px;
    }
    .skill-search:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
    }
    .skill-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }
    .skill-filter-chip {
      padding: 5px 12px;
      border: 1px solid var(--border);
      border-radius: 20px;
      background: var(--bg-elevated);
      color: var(--muted);
      font-size: 12px;
      font-weight: 500;
      font-family: var(--font-body);
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }
    .skill-filter-chip:hover {
      border-color: var(--border-strong);
      color: var(--text);
    }
    .skill-filter-chip.active {
      border-color: var(--teal);
      background: rgba(20, 184, 166, 0.12);
      color: var(--teal-bright);
    }
    .skill-empty-state {
      color: var(--muted);
      font-size: 13px;
      text-align: center;
      padding: 20px 0;
      display: none;
    }

    /* ===================== Step 5: Review & Deploy ===================== */
    .review-summary {
      margin-bottom: 24px;
    }
    .review-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .review-row:last-child { border-bottom: none; }
    .review-label {
      color: var(--muted);
      font-size: 13px;
    }
    .review-value {
      color: var(--text-strong);
      font-size: 14px;
      font-weight: 500;
    }
    .deploy-area { /* Wrapper for deploy button */ }
    .deploy-progress {
      display: none;
      text-align: center;
    }
    .deploy-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid var(--border);
      border-top-color: var(--teal);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    .deploy-spinner.error {
      border-top-color: var(--accent);
      animation: none;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .deploy-status {
      font-size: 15px;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 12px;
    }
    .deploy-log {
      background: var(--bg);
      color: var(--teal-bright);
      font-family: var(--mono);
      font-size: 12px;
      padding: 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      max-height: 220px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      text-align: left;
      margin-bottom: 16px;
    }
    .deploy-success {
      display: none;
      text-align: center;
      padding: 20px 0;
    }
    .success-check {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--teal);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 28px;
      color: #fff;
    }
    .success-heading {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      color: var(--text-strong);
      margin: 0 0 8px 0;
    }
    .success-sub {
      color: var(--muted);
      font-size: 14px;
      margin: 0 0 20px 0;
    }
    .success-links {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .success-links a {
      text-decoration: none;
    }

    /* ===================== Already Configured ===================== */
    .configured-card {
      max-width: 480px;
      margin: 80px auto;
      text-align: center;
      background: var(--card);
      padding: 40px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
    }
    .configured-check {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--teal);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 28px;
      color: #fff;
    }
    .configured-card h2 {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      color: var(--text-strong);
      margin: 0 0 8px 0;
    }
    .configured-status {
      font-size: 14px;
      margin-bottom: 24px;
    }
    .configured-status .running { color: var(--teal-bright); }
    .configured-status .stopped { color: var(--accent); }
    .configured-links {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .configured-links a { text-decoration: none; }

    .hidden { display: none !important; }

    /* ===================== Mobile ===================== */
    @media (max-width: 600px) {
      body { padding: 12px; }
      .wizard-container { max-width: 100%; }
      .step-label { display: none; }
      .wizard-steps { gap: 0; }
      .step-connector { min-width: 16px; margin: 0 4px; }
      .provider-grid { grid-template-columns: repeat(2, 1fr); }
      .skill-grid { grid-template-columns: repeat(2, 1fr); }
      .skill-section-header { flex-wrap: wrap; gap: 4px; }
      .wizard-nav { gap: 8px; }
      .wizard-nav button { flex: 1; justify-content: center; }
      .card { padding: 20px; }
      .welcome-heading { font-size: 22px; }
      .success-links, .configured-links { flex-direction: column; align-items: center; }
    }
    @media (max-width: 400px) {
      .provider-grid { grid-template-columns: 1fr; }
      .skill-grid { grid-template-columns: 1fr; }
    }

    /* Restore overlay */
    .restore-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .restore-overlay.hidden { display: none; }
    .restore-status-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px;
      max-width: 480px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    .restore-status-card h3 {
      font-family: var(--font-display);
      color: var(--text-strong);
      margin: 0 0 16px 0;
      font-size: 18px;
    }
    .restore-steps {
      text-align: left;
      font-family: var(--mono);
      font-size: 12px;
      color: var(--muted);
      line-height: 1.8;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 12px;
    }
    .restore-steps .step-ok { color: var(--ok); }
    .restore-steps .step-ok::before { content: '\\2713 '; }
    .restore-steps .step-err { color: var(--danger); }
    .restore-steps .step-err::before { content: '\\2717 '; }
    .restore-spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid var(--border-strong);
      border-top-color: var(--teal-bright);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .restore-done-btn {
      margin-top: 16px;
    }

    /* Toast */
    .restore-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(80px);
      padding: 12px 24px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      font-family: var(--font-body);
      z-index: 1100;
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
      pointer-events: none;
    }
    .restore-toast.visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    .restore-toast.success {
      background: var(--ok);
      color: #fff;
    }
    .restore-toast.error {
      background: var(--danger);
      color: #fff;
    }

    /* Hidden file input */
    input.restore-file-input { display: none; }

    /* Device-code pairing panel */
    #device-pairing { display: none; }
    .pair-card {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      background: var(--card-2, rgba(255,255,255,0.02));
      margin-bottom: 16px;
    }
    .pair-step { display: flex; align-items: center; gap: 12px; margin: 12px 0; flex-wrap: wrap; }
    .pair-num {
      flex: none; width: 26px; height: 26px; border-radius: 50%;
      background: var(--accent, #ff5a2d); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px;
    }
    .pair-code {
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 28px; font-weight: 700; letter-spacing: 4px;
      padding: 8px 16px; border-radius: 8px;
      background: rgba(255,255,255,0.06); border: 1px solid var(--border);
      user-select: all;
    }
    .pair-code.waiting { opacity: 0.5; font-size: 16px; letter-spacing: normal; }
    #device-term {
      margin-top: 16px; border-radius: 8px; overflow: hidden;
      background: #12141a; min-height: 220px;
    }
    .pair-status { margin-top: 12px; font-size: 14px; color: var(--muted); }
    .pair-status.success { color: #10b981; }
    .pair-status.error { color: #ef4444; }
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5/css/xterm.min.css"/>
</head>
<body>

  <input type="file" id="restore-file" class="restore-file-input"
    accept=".tar.gz,.tgz,.gz,.zip,application/gzip,application/x-gzip,application/zip"
    onchange="handleRestoreFile(this)"/>
  <div id="restore-overlay" class="restore-overlay hidden">
    <div class="restore-status-card">
      <div class="restore-spinner" id="restore-spinner"></div>
      <h3 id="restore-overlay-title" data-i18n="restore.confirmTitle">Restore from Backup</h3>
      <div class="restore-steps" id="restore-steps"></div>
      <button class="btn btn-primary restore-done-btn hidden" id="restore-done-btn" onclick="closeRestoreOverlay()">OK</button>
    </div>
  </div>
  <div id="restore-toast" class="restore-toast"></div>

  ${isConfigured ? `
  <!-- =============== Already Configured =============== -->
  <div id="configured-view" class="configured-card">
    <div class="configured-lang-selector">
      ${getLangSelectorHTML('configured')}
    </div>
    <div class="configured-check">&#10003;</div>
    <h2 data-i18n="configured.title">OpenClaw is already configured</h2>
    <p class="configured-status">
      Gateway: <span class="${gatewayInfo.running ? 'running' : 'stopped'}">${gatewayInfo.running ? 'Running' : 'Stopped'}</span>
    </p>
    <div class="configured-links">
      <a href="/lite?password=${encodeURIComponent(password)}" class="btn btn-primary" data-i18n="configured.openPanel">Open Lite Panel</a>
      <a href="/openclaw" class="btn btn-secondary" data-i18n="configured.openDashboard">Open OpenClaw Gateway Dashboard</a>
    </div>
    <button class="btn-text" onclick="showReconfigureWarning()" data-i18n="configured.reconfigure">Reconfigure from scratch</button> <span class="separator" style="color: #c0c0c0;">|</span> 
    <button class="btn-text" onclick="document.getElementById('restore-file').click()" data-i18n="configured.restoreBackup">Restore from Backup</button>
  </div>
  ` : ''}

  <!-- =============== Wizard =============== -->
  <div id="wizard-view" class="wizard-container ${isConfigured ? 'hidden' : ''}">
    <div class="wizard-header">
      <h1>
        <svg class="logo" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lobster-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff4d4d"/><stop offset="100%" stop-color="#991b1b"/></linearGradient></defs><path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-gradient)"/><path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-gradient)"/><path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-gradient)"/><path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" stroke-width="3" stroke-linecap="round"/><path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" stroke-width="3" stroke-linecap="round"/><circle cx="45" cy="35" r="6" fill="#050810"/><circle cx="75" cy="35" r="6" fill="#050810"/><circle cx="46" cy="34" r="2.5" fill="#00e5cc"/><circle cx="76" cy="34" r="2.5" fill="#00e5cc"/></svg>
        <span data-i18n="pageTitle">OpenClaw Onboarding Wizard</span>
      </h1>
      ${getLangSelectorHTML('wizard')}
    </div>

    <!-- Step indicator -->
    <div class="wizard-steps">
      <div class="wizard-step active" data-step="1" onclick="clickStep(1)">
        <div class="step-circle"><span>1</span></div>
        <span class="step-label" data-i18n="steps.welcome">Welcome</span>
      </div>
      <div class="step-connector" data-connector="1"></div>
      <div class="wizard-step disabled" data-step="2" onclick="clickStep(2)">
        <div class="step-circle"><span>2</span></div>
        <span class="step-label" data-i18n="steps.provider">AI Provider</span>
      </div>
      <div class="step-connector" data-connector="2"></div>
      <div class="wizard-step disabled" data-step="3" onclick="clickStep(3)">
        <div class="step-circle"><span>3</span></div>
        <span class="step-label" data-i18n="steps.channels">Channels</span>
      </div>
      <div class="step-connector" data-connector="3"></div>
      <div class="wizard-step disabled" data-step="4" onclick="clickStep(4)">
        <div class="step-circle"><span>4</span></div>
        <span class="step-label" data-i18n="steps.skills">Skills</span>
      </div>
      <div class="step-connector" data-connector="4"></div>
      <div class="wizard-step disabled" data-step="5" onclick="clickStep(5)">
        <div class="step-circle"><span>5</span></div>
        <span class="step-label" data-i18n="steps.deploy">Deploy</span>
      </div>
    </div>

    <!-- ===== Step 1: Welcome ===== -->
    <div class="step-panel active" id="step-1">
      <div class="card" style="text-align: center;">
        <svg class="welcome-logo" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wlg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff4d4d"/><stop offset="100%" stop-color="#991b1b"/></linearGradient></defs><path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#wlg)"/><path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#wlg)"/><path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#wlg)"/><path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" stroke-width="3" stroke-linecap="round"/><path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" stroke-width="3" stroke-linecap="round"/><circle cx="45" cy="35" r="6" fill="#050810"/><circle cx="75" cy="35" r="6" fill="#050810"/><circle cx="46" cy="34" r="2.5" fill="#00e5cc"/><circle cx="76" cy="34" r="2.5" fill="#00e5cc"/></svg>
        <h2 class="welcome-heading" data-i18n="step1.heading">Welcome to OpenClaw</h2>
        <p class="welcome-sub" data-i18n="step1.subtitle">Your personal AI assistant for Telegram, Discord, Slack, and more</p>

        <ul class="welcome-steps" style="text-align: left; max-width: 380px; margin: 0 auto 24px;">
          <li><span class="step-icon">1</span> <span data-i18n="step1.list1">Connect an AI provider</span></li>
          <li><span class="step-icon">2</span> <span data-i18n="step1.list2">Add messaging channels</span></li>
          <li><span class="step-icon">3</span> <span data-i18n="step1.list3">Pick skills</span></li>
          <li><span class="step-icon">4</span> <span data-i18n="step1.list4">Deploy and start chatting</span></li>
        </ul>

        <div class="before-section" style="text-align: left;">
          <h3 data-i18n="step1.beforeTitle">Before you begin</h3>
          <p style="color: var(--muted); font-size: 13px; margin: 0 0 10px 0;" data-i18n="step1.beforeDesc">You'll need an API key from at least one provider:</p>
          <div class="key-links">
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" class="key-link">Anthropic</a>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" class="key-link">OpenAI</a>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" class="key-link">Google Gemini</a>
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" class="key-link">OpenRouter</a>
            <span class="key-link" style="cursor: default; color: var(--muted); border-color: var(--border);" data-i18n="step1.moreProviders">+ 8 more providers</span>
          </div>
        </div>
      </div>
      <div class="wizard-nav">
        <button class="btn-text" onclick="document.getElementById('restore-file').click()" data-i18n="step1.restoreBackup">Restore from Backup</button>
        <button class="btn-primary" onclick="goToStep(2)" data-i18n="step1.getStarted">Get Started &rarr;</button>
      </div>
    </div>

    <!-- ===== Step 2: AI Provider ===== -->
    <div class="step-panel" id="step-2">
      <div class="card">
        <div class="form-group">
          <label class="form-label" data-i18n="step2.selectProvider">Select your AI provider</label>
          <h4 class="provider-category-label" data-i18n="step2.popular">Popular</h4>
          <div class="provider-grid" id="provider-grid-popular"></div>
          <h4 class="provider-category-label" data-i18n="step2.moreProviders">More Providers</h4>
          <div class="provider-grid" id="provider-grid-more"></div>
        </div>

        <div class="form-group" id="auth-methods-group" style="display: none;">
          <div class="auth-methods">
            <label class="auth-methods-label" data-i18n="step2.authMethod">Authentication Method</label>
            <div class="radio-group" id="auth-radio-group"></div>
          </div>
        </div>

        <div class="form-group" id="secret-group" style="display: none;">
          <label class="form-label" for="secret-input" id="secret-label" data-i18n="step2.apiKey">API Key</label>
          <input id="secret-input" type="password" class="form-input" data-i18n-placeholder="step2.apiKeyPlaceholder" placeholder="Enter your key or token..."/>
          <p class="form-hint" id="secret-hint" data-i18n="step2.apiKeyHint">Your key is sent directly to OpenClaw and never stored by this UI.</p>
        </div>

        <div class="form-group">
          <label class="form-label" for="flow-select" data-i18n="step2.persona">Agent Persona (optional)</label>
          <select id="flow-select" class="form-select">
            <option value="">Default</option>
            <option value="assistant">Assistant</option>
            <option value="coder">Coder</option>
            <option value="creative">Creative</option>
          </select>
        </div>

        <div id="step2-error" class="inline-error"></div>
      </div>
      <div class="wizard-nav">
        <button class="btn-secondary" onclick="goToStep(1)" data-i18n="nav.back">&larr; Back</button>
        <button class="btn-primary" onclick="validateAndGoToStep(3)" data-i18n="step2.next">Next: Channels &rarr;</button>
      </div>
    </div>

    <!-- ===== Step 3: Channels ===== -->
    <div class="step-panel" id="step-3">
      <div class="card">
        <p class="channels-desc" data-i18n="step3.desc">Optionally connect messaging platforms. You can add channels later from the Lite Panel.</p>

        <div class="channel-cards" id="channel-cards-container"></div>
      </div>
      <div class="wizard-nav">
        <button class="btn-secondary" onclick="goToStep(2)" data-i18n="nav.back">&larr; Back</button>
        <button class="btn-primary" onclick="goToStep(4)" data-i18n="step3.next">Next: Skills &rarr;</button>
      </div>
    </div>

    <!-- ===== Step 4: Skills ===== -->
    <div class="step-panel" id="step-4">
      <div class="card">
        <p class="skills-desc" data-i18n="step4.desc">Choose skills to enhance your assistant. You can add more later.</p>

        <h4 class="channel-category-label" data-i18n="step4.defaultSkills">Default Skills</h4>
        <input type="text" class="skill-search" id="default-skill-search" data-i18n-placeholder="step4.searchPlaceholder" placeholder="Search skills..." />
        <div class="skill-filters" id="default-skill-filters"></div>
        <div class="skill-grid" id="skill-grid-default"></div>
        <p class="skill-empty-state" id="default-skill-empty" data-i18n="step4.noMatch">No skills match your search.</p>

        <div class="skill-section-header" style="margin-top: 24px;">
          <h4 class="channel-category-label" style="margin: 0;" data-i18n="step4.bwcTitle">Build with Claude Skills</h4>
          <a href="https://buildwithclaude.com/skills" target="_blank" rel="noopener" data-i18n="step4.bwcBrowse">Browse all &rarr;</a>
        </div>
        <p id="bwc-loading" style="color: var(--muted); font-size: 13px;" data-i18n="step4.bwcLoading">Loading skills...</p>
        <input type="text" class="skill-search" id="bwc-skill-search" data-i18n-placeholder="step4.searchPlaceholder" placeholder="Search skills..." style="display: none;" />
        <div class="skill-filters" id="bwc-skill-filters"></div>
        <div class="skill-grid" id="skill-grid-bwc"></div>
        <p class="skill-empty-state" id="bwc-skill-empty" data-i18n="step4.noMatch">No skills match your search.</p>
      </div>
      <div class="wizard-nav">
        <button class="btn-secondary" onclick="goToStep(3)" data-i18n="nav.back">&larr; Back</button>
        <button class="btn-primary" onclick="goToStep(5)" data-i18n="step4.next">Next: Deploy &rarr;</button>
      </div>
    </div>

    <!-- ===== Step 5: Review & Deploy ===== -->
    <div class="step-panel" id="step-5">
      <div class="card">
        <div id="deploy-area">
          <div class="review-summary" id="review-summary"></div>
          <button class="btn-deploy" id="deploy-btn" onclick="deploy()" data-i18n="step5.deployBtn">Deploy OpenClaw</button>
        </div>

        <div class="deploy-progress" id="deploy-progress">
          <div class="deploy-spinner" id="deploy-spinner"></div>
          <div class="deploy-status" id="deploy-status" data-i18n="step5.deploying">Deploying...</div>
          <pre class="deploy-log" id="deploy-log"></pre>
          <button class="btn-primary hidden" id="retry-btn" onclick="retryDeploy()" data-i18n="step5.retry">Retry</button>
        </div>

        <div class="deploy-success" id="deploy-success">
          <div class="success-check">&#10003;</div>
          <h2 class="success-heading" data-i18n="step5.success.heading">OpenClaw is running!</h2>
          <p class="success-sub" data-i18n="step5.success.subtitle">Your AI assistant is ready to go.</p>
          <div class="success-links">
            <a href="/lite?password=${encodeURIComponent(password)}" class="btn btn-primary" data-i18n="step5.success.openPanel">Open Lite Panel</a>
            <a href="/openclaw" class="btn btn-secondary" data-i18n="step5.success.openDashboard">Open OpenClaw Gateway Dashboard</a>
          </div>
        </div>

        <!-- Device-code pairing (ChatGPT/Codex). Shown instead of the normal deploy flow
             when the selected auth choice is interactive device pairing. -->
        <div id="device-pairing">
          <div class="pair-card">
            <h2 class="success-heading" style="margin-top:0">Pair your ChatGPT / Codex account</h2>
            <div class="pair-step">
              <span class="pair-num">1</span>
              <span>Open the OpenAI pairing page:</span>
              <a id="pair-url" href="#" target="_blank" rel="noopener" class="btn btn-primary">Open auth page</a>
            </div>
            <div class="pair-step">
              <span class="pair-num">2</span>
              <span>Enter this code, then sign in with your ChatGPT/Codex subscription:</span>
              <span id="pair-code" class="pair-code waiting">starting…</span>
            </div>
            <div class="pair-step">
              <span class="pair-num">3</span>
              <span>Keep this tab open — it finishes automatically once you approve.</span>
            </div>
            <div id="pair-status" class="pair-status">Connecting to the pairing terminal…</div>
            <div id="device-term"></div>
          </div>
          <div class="success-links" id="pair-done-links" style="display:none">
            <a href="/lite?password=${encodeURIComponent(password)}" class="btn btn-primary">Open Lite Panel</a>
            <a href="/openclaw" class="btn btn-secondary">Open OpenClaw Gateway Dashboard</a>
          </div>
          <button class="btn-primary hidden" id="pair-retry-btn" onclick="deploy()" style="margin-top:12px">Retry pairing</button>
        </div>
      </div>
      <div class="wizard-nav" id="step5-nav">
        <button class="btn-secondary" id="step5-back" onclick="goToStep(4)" data-i18n="nav.back">&larr; Back</button>
        <div></div>
      </div>
    </div>
  </div>

  <!-- xterm.js for the Codex device-pairing terminal (loaded once, used on demand) -->
  <script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5/lib/xterm.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0/lib/addon-fit.min.js"></script>
  <script>
    (function() {
      var password = ${JSON.stringify(password)};
      var authGroups = ${JSON.stringify(authGroups || [])};
      var channelGroups = ${JSON.stringify(channelGroups || [])};

      var currentStep = 1;
      var highestStep = 1;
      var wizardLocked = false;
      var selectedProviderIndex = null;
      var selectedAuthChoice = null;
      var enabledChannels = {};
      channelGroups.forEach(function(ch) { enabledChannels[ch.name] = false; });
      var selectedSkills = []; // Array of {slug, source} objects
      var defaultSkillFilter = 'Popular';
      var defaultSkillSearch = '';
      var bwcSkillFilter = 'Popular';
      var bwcSkillSearch = '';
      var bwcSkillsData = [];
      var BWC_POPULAR_COUNT = 6;

      // ========== i18n ==========

      var TRANSLATIONS = {
        en: {
          'pageTitle': 'OpenClaw Onboarding Wizard',
          'configured.title': 'OpenClaw is already configured',
          'configured.openPanel': 'Open Lite Panel',
          'configured.openDashboard': 'Open OpenClaw Gateway Dashboard',
          'configured.reconfigure': 'Reconfigure from scratch',
          'configured.restoreBackup': 'Restore from Backup',
          'configured.confirmReset': 'This will delete the current configuration and stop the gateway. Are you sure?',
          'configured.resetFailed': 'Reset failed: {error}',
          'step1.restoreBackup': 'Restore from Backup',
          'restore.confirmTitle': 'Restore from Backup',
          'restore.confirmMessage': 'This will replace your current configuration with the backup file "{filename}". An auto-backup will be created first. The gateway will be restarted.',
          'restore.invalidFile': 'Please select a .tar.gz, .tgz, or .zip file',
          'restore.restoring': 'Restoring...',
          'restore.success': 'Restore completed successfully. Reloading...',
          'restore.failed': 'Restore failed: {error}',
          'restore.error': 'Restore error: {error}',
          'steps.welcome': 'Welcome',
          'steps.provider': 'AI Provider',
          'steps.channels': 'Channels',
          'steps.skills': 'Skills',
          'steps.deploy': 'Deploy',
          'step1.heading': 'Welcome to OpenClaw',
          'step1.subtitle': 'Your personal AI assistant for Telegram, Discord, Slack, and more',
          'step1.list1': 'Connect an AI provider',
          'step1.list2': 'Add messaging channels',
          'step1.list3': 'Pick skills',
          'step1.list4': 'Deploy and start chatting',
          'step1.beforeTitle': 'Before you begin',
          'step1.beforeDesc': "You'll need an API key from at least one provider:",
          'step1.moreProviders': '+ 8 more providers',
          'step1.getStarted': 'Get Started \u2192',
          'step2.selectProvider': 'Select your AI provider',
          'step2.popular': 'Popular',
          'step2.moreProviders': 'More Providers',
          'step2.authMethod': 'Authentication Method',
          'step2.apiKey': 'API Key',
          'step2.apiKeyPlaceholder': 'Enter your key or token...',
          'step2.apiKeyHint': 'Your key is sent directly to OpenClaw and never stored by this UI.',
          'step2.apiKeyHintLink': 'Get your key from ',
          'step2.persona': 'Agent Persona (optional)',
          'step2.next': 'Next: Channels \u2192',
          'step2.err.noProvider': 'Please select an AI provider.',
          'step2.err.noAuth': 'Please select an authentication method.',
          'step2.err.noKey': 'Please enter your API key or token.',
          'step2.err.missingFields': 'Please fill in all required fields.',
          'step3.desc': 'Optionally connect messaging platforms. You can add channels later from the Lite Panel.',
          'step3.next': 'Next: Skills \u2192',
          'step3.catPopular': 'Popular',
          'step3.catMore': 'More Channels',
          'step4.desc': 'Choose skills to enhance your assistant. You can add more later.',
          'step4.defaultSkills': 'Default Skills',
          'step4.searchPlaceholder': 'Search skills...',
          'step4.noMatch': 'No skills match your search.',
          'step4.bwcTitle': 'Build with Claude Skills',
          'step4.bwcBrowse': 'Browse all \u2192',
          'step4.bwcLoading': 'Loading skills...',
          'step4.bwcEmpty': 'No skills available at the moment.',
          'step4.bwcError': 'Could not load Build with Claude skills. You can add them later from the management panel.',
          'step4.next': 'Next: Deploy \u2192',
          'step4.filterPopular': 'Popular',
          'step5.deployBtn': 'Deploy OpenClaw',
          'step5.deploying': 'Deploying...',
          'step5.failed': 'Deployment failed',
          'step5.retry': 'Retry',
          'step5.success.heading': 'OpenClaw is running!',
          'step5.success.subtitle': 'Your AI assistant is ready to go.',
          'step5.success.openPanel': 'Open Lite Panel',
          'step5.success.openDashboard': 'Open OpenClaw Gateway Dashboard',
          'nav.back': '\u2190 Back',
          'review.provider': 'Provider',
          'review.authMethod': 'Auth Method',
          'review.persona': 'Persona',
          'review.channels': 'Channels',
          'review.skills': 'Skills',
          'review.none': 'None',
          'review.default': 'Default',
          'review.skillCount': '{names} ({count} selected)'
        },
        'zh-TW': {
          'pageTitle': 'OpenClaw \u8A2D\u5B9A',
          'configured.title': 'OpenClaw \u5DF2\u7D93\u8A2D\u5B9A\u5B8C\u6210',
          'configured.openPanel': '\u958B\u555F\u7BA1\u7406\u9762\u677F',
          'configured.openDashboard': '\u958B\u555F OpenClaw \u7DB2\u95DC\u5100\u8868\u677F',
          'configured.reconfigure': '\u91CD\u65B0\u8A2D\u5B9A',
          'configured.restoreBackup': '\u5F9E\u5099\u4EFD\u9084\u539F',
          'configured.confirmReset': '\u9019\u5C07\u522A\u9664\u76EE\u524D\u7684\u8A2D\u5B9A\u4E26\u505C\u6B62\u7DB2\u95DC\u3002\u78BA\u5B9A\u8981\u7E7C\u7E8C\u55CE\uFF1F',
          'configured.resetFailed': '\u91CD\u8A2D\u5931\u6557\uFF1A{error}',
          'step1.restoreBackup': '\u5F9E\u5099\u4EFD\u9084\u539F',
          'restore.confirmTitle': '\u5F9E\u5099\u4EFD\u9084\u539F',
          'restore.confirmMessage': '\u9019\u5C07\u4EE5\u5099\u4EFD\u6A94\u300C{filename}\u300D\u53D6\u4EE3\u76EE\u524D\u7684\u8A2D\u5B9A\u3002\u7CFB\u7D71\u6703\u5148\u81EA\u52D5\u5099\u4EFD\u3002\u7DB2\u95DC\u5C07\u6703\u91CD\u65B0\u555F\u52D5\u3002',
          'restore.invalidFile': '\u8ACB\u9078\u64C7 .tar.gz\u3001.tgz \u6216 .zip \u6A94\u6848',
          'restore.restoring': '\u6B63\u5728\u9084\u539F...',
          'restore.success': '\u9084\u539F\u5B8C\u6210\uFF0C\u6B63\u5728\u91CD\u65B0\u8F09\u5165...',
          'restore.failed': '\u9084\u539F\u5931\u6557\uFF1A{error}',
          'restore.error': '\u9084\u539F\u932F\u8AA4\uFF1A{error}',
          'steps.welcome': '\u6B61\u8FCE',
          'steps.provider': 'AI \u63D0\u4F9B\u8005',
          'steps.channels': '\u983B\u9053',
          'steps.skills': '\u6280\u80FD',
          'steps.deploy': '\u90E8\u7F72',
          'step1.heading': '\u6B61\u8FCE\u4F7F\u7528 OpenClaw',
          'step1.subtitle': '\u60A8\u7684\u500B\u4EBA AI \u52A9\u7406\uFF0C\u652F\u63F4 Telegram\u3001Discord\u3001Slack \u7B49\u5E73\u53F0',
          'step1.list1': '\u9023\u63A5 AI \u63D0\u4F9B\u8005',
          'step1.list2': '\u65B0\u589E\u8A0A\u606F\u983B\u9053',
          'step1.list3': '\u9078\u64C7\u6280\u80FD',
          'step1.list4': '\u90E8\u7F72\u4E26\u958B\u59CB\u804A\u5929',
          'step1.beforeTitle': '\u958B\u59CB\u4E4B\u524D',
          'step1.beforeDesc': '\u60A8\u9700\u8981\u81F3\u5C11\u4E00\u500B\u63D0\u4F9B\u8005\u7684 API \u91D1\u9470\uFF1A',
          'step1.moreProviders': '+ \u53E6\u5916 8 \u500B\u63D0\u4F9B\u8005',
          'step1.getStarted': '\u958B\u59CB\u8A2D\u5B9A \u2192',
          'step2.selectProvider': '\u9078\u64C7\u60A8\u7684 AI \u63D0\u4F9B\u8005',
          'step2.popular': '\u71B1\u9580',
          'step2.moreProviders': '\u66F4\u591A\u63D0\u4F9B\u8005',
          'step2.authMethod': '\u9A57\u8B49\u65B9\u5F0F',
          'step2.apiKey': 'API \u91D1\u9470',
          'step2.apiKeyPlaceholder': '\u8F38\u5165\u60A8\u7684\u91D1\u9470\u6216\u4EE3\u5E63...',
          'step2.apiKeyHint': '\u60A8\u7684\u91D1\u9470\u76F4\u63A5\u50B3\u9001\u5230 OpenClaw\uFF0C\u4E0D\u6703\u88AB\u6B64 UI \u5132\u5B58\u3002',
          'step2.apiKeyHintLink': '\u5F9E\u4EE5\u4E0B\u7DB2\u7AD9\u53D6\u5F97\u91D1\u9470\uFF1A',
          'step2.persona': '\u52A9\u7406\u89D2\u8272\uFF08\u9078\u586B\uFF09',
          'step2.next': '\u4E0B\u4E00\u6B65\uFF1A\u983B\u9053 \u2192',
          'step2.err.noProvider': '\u8ACB\u9078\u64C7\u4E00\u500B AI \u63D0\u4F9B\u8005\u3002',
          'step2.err.noAuth': '\u8ACB\u9078\u64C7\u9A57\u8B49\u65B9\u5F0F\u3002',
          'step2.err.noKey': '\u8ACB\u8F38\u5165\u60A8\u7684 API \u91D1\u9470\u6216\u4EE3\u5E63\u3002',
          'step2.err.missingFields': '\u8ACB\u586B\u5BEB\u6240\u6709\u5FC5\u586B\u6B04\u4F4D\u3002',
          'step3.desc': '\u53EF\u9078\u64C7\u9023\u63A5\u8A0A\u606F\u5E73\u53F0\u3002\u60A8\u53EF\u4EE5\u7A0D\u5F8C\u5F9E\u7BA1\u7406\u9762\u677F\u65B0\u589E\u983B\u9053\u3002',
          'step3.next': '\u4E0B\u4E00\u6B65\uFF1A\u6280\u80FD \u2192',
          'step3.catPopular': '\u71B1\u9580',
          'step3.catMore': '\u66F4\u591A\u983B\u9053',
          'step4.desc': '\u9078\u64C7\u6280\u80FD\u4F86\u589E\u5F37\u60A8\u7684\u52A9\u7406\u3002\u60A8\u53EF\u4EE5\u7A0D\u5F8C\u518D\u65B0\u589E\u3002',
          'step4.defaultSkills': '\u9810\u8A2D\u6280\u80FD',
          'step4.searchPlaceholder': '\u641C\u5C0B\u6280\u80FD...',
          'step4.noMatch': '\u6C92\u6709\u7B26\u5408\u641C\u5C0B\u7684\u6280\u80FD\u3002',
          'step4.bwcTitle': 'Build with Claude \u6280\u80FD',
          'step4.bwcBrowse': '\u700F\u89BD\u5168\u90E8 \u2192',
          'step4.bwcLoading': '\u6B63\u5728\u8F09\u5165\u6280\u80FD...',
          'step4.bwcEmpty': '\u76EE\u524D\u6C92\u6709\u53EF\u7528\u7684\u6280\u80FD\u3002',
          'step4.bwcError': '\u7121\u6CD5\u8F09\u5165 Build with Claude \u6280\u80FD\u3002\u60A8\u53EF\u4EE5\u7A0D\u5F8C\u5F9E\u7BA1\u7406\u9762\u677F\u65B0\u589E\u3002',
          'step4.next': '\u4E0B\u4E00\u6B65\uFF1A\u90E8\u7F72 \u2192',
          'step4.filterPopular': '\u71B1\u9580',
          'step5.deployBtn': '\u90E8\u7F72 OpenClaw',
          'step5.deploying': '\u6B63\u5728\u90E8\u7F72...',
          'step5.failed': '\u90E8\u7F72\u5931\u6557',
          'step5.retry': '\u91CD\u8A66',
          'step5.success.heading': 'OpenClaw \u5DF2\u555F\u52D5\uFF01',
          'step5.success.subtitle': '\u60A8\u7684 AI \u52A9\u7406\u5DF2\u6E96\u5099\u5C31\u7DD2\u3002',
          'step5.success.openPanel': '\u958B\u555F\u7BA1\u7406\u9762\u677F',
          'step5.success.openDashboard': '\u958B\u555F OpenClaw \u7DB2\u95DC\u5100\u8868\u677F',
          'nav.back': '\u2190 \u4E0A\u4E00\u6B65',
          'review.provider': '\u63D0\u4F9B\u8005',
          'review.authMethod': '\u9A57\u8B49\u65B9\u5F0F',
          'review.persona': '\u52A9\u7406\u89D2\u8272',
          'review.channels': '\u983B\u9053',
          'review.skills': '\u6280\u80FD',
          'review.none': '\u7121',
          'review.default': '\u9810\u8A2D',
          'review.skillCount': '{names}\uFF08\u5DF2\u9078 {count} \u500B\uFF09'
        },
        'zh-CN': {
          'pageTitle': 'OpenClaw \u8BBE\u7F6E',
          'configured.title': 'OpenClaw \u5DF2\u7ECF\u8BBE\u7F6E\u5B8C\u6210',
          'configured.openPanel': '\u6253\u5F00\u7BA1\u7406\u9762\u677F',
          'configured.openDashboard': '\u6253\u5F00 OpenClaw \u7F51\u5173\u4EEA\u8868\u677F',
          'configured.reconfigure': '\u91CD\u65B0\u8BBE\u7F6E',
          'configured.restoreBackup': '\u4ECE\u5907\u4EFD\u6062\u590D',
          'configured.confirmReset': '\u8FD9\u5C06\u5220\u9664\u5F53\u524D\u914D\u7F6E\u5E76\u505C\u6B62\u7F51\u5173\u3002\u786E\u5B9A\u8981\u7EE7\u7EED\u5417\uFF1F',
          'configured.resetFailed': '\u91CD\u7F6E\u5931\u8D25\uFF1A{error}',
          'step1.restoreBackup': '\u4ECE\u5907\u4EFD\u6062\u590D',
          'restore.confirmTitle': '\u4ECE\u5907\u4EFD\u6062\u590D',
          'restore.confirmMessage': '\u8FD9\u5C06\u4EE5\u5907\u4EFD\u6587\u4EF6\u201C{filename}\u201D\u66FF\u6362\u5F53\u524D\u914D\u7F6E\u3002\u7CFB\u7EDF\u4F1A\u5148\u81EA\u52A8\u5907\u4EFD\u3002\u7F51\u5173\u5C06\u4F1A\u91CD\u65B0\u542F\u52A8\u3002',
          'restore.invalidFile': '\u8BF7\u9009\u62E9 .tar.gz\u3001.tgz \u6216 .zip \u6587\u4EF6',
          'restore.restoring': '\u6B63\u5728\u6062\u590D...',
          'restore.success': '\u6062\u590D\u5B8C\u6210\uFF0C\u6B63\u5728\u91CD\u65B0\u52A0\u8F7D...',
          'restore.failed': '\u6062\u590D\u5931\u8D25\uFF1A{error}',
          'restore.error': '\u6062\u590D\u9519\u8BEF\uFF1A{error}',
          'steps.welcome': '\u6B22\u8FCE',
          'steps.provider': 'AI \u63D0\u4F9B\u8005',
          'steps.channels': '\u9891\u9053',
          'steps.skills': '\u6280\u80FD',
          'steps.deploy': '\u90E8\u7F72',
          'step1.heading': '\u6B22\u8FCE\u4F7F\u7528 OpenClaw',
          'step1.subtitle': '\u60A8\u7684\u4E2A\u4EBA AI \u52A9\u7406\uFF0C\u652F\u6301 Telegram\u3001Discord\u3001Slack \u7B49\u5E73\u53F0',
          'step1.list1': '\u8FDE\u63A5 AI \u63D0\u4F9B\u8005',
          'step1.list2': '\u6DFB\u52A0\u6D88\u606F\u9891\u9053',
          'step1.list3': '\u9009\u62E9\u6280\u80FD',
          'step1.list4': '\u90E8\u7F72\u5E76\u5F00\u59CB\u804A\u5929',
          'step1.beforeTitle': '\u5F00\u59CB\u4E4B\u524D',
          'step1.beforeDesc': '\u60A8\u9700\u8981\u81F3\u5C11\u4E00\u4E2A\u63D0\u4F9B\u8005\u7684 API \u5BC6\u94A5\uFF1A',
          'step1.moreProviders': '+ \u53E6\u5916 8 \u4E2A\u63D0\u4F9B\u8005',
          'step1.getStarted': '\u5F00\u59CB\u8BBE\u7F6E \u2192',
          'step2.selectProvider': '\u9009\u62E9\u60A8\u7684 AI \u63D0\u4F9B\u8005',
          'step2.popular': '\u70ED\u95E8',
          'step2.moreProviders': '\u66F4\u591A\u63D0\u4F9B\u8005',
          'step2.authMethod': '\u9A8C\u8BC1\u65B9\u5F0F',
          'step2.apiKey': 'API \u5BC6\u94A5',
          'step2.apiKeyPlaceholder': '\u8F93\u5165\u60A8\u7684\u5BC6\u94A5\u6216\u4EE4\u724C...',
          'step2.apiKeyHint': '\u60A8\u7684\u5BC6\u94A5\u76F4\u63A5\u53D1\u9001\u5230 OpenClaw\uFF0C\u4E0D\u4F1A\u88AB\u6B64 UI \u5B58\u50A8\u3002',
          'step2.apiKeyHintLink': '\u4ECE\u4EE5\u4E0B\u7F51\u7AD9\u83B7\u53D6\u5BC6\u94A5\uFF1A',
          'step2.persona': '\u52A9\u7406\u89D2\u8272\uFF08\u53EF\u9009\uFF09',
          'step2.next': '\u4E0B\u4E00\u6B65\uFF1A\u9891\u9053 \u2192',
          'step2.err.noProvider': '\u8BF7\u9009\u62E9\u4E00\u4E2A AI \u63D0\u4F9B\u8005\u3002',
          'step2.err.noAuth': '\u8BF7\u9009\u62E9\u9A8C\u8BC1\u65B9\u5F0F\u3002',
          'step2.err.noKey': '\u8BF7\u8F93\u5165\u60A8\u7684 API \u5BC6\u94A5\u6216\u4EE4\u724C\u3002',
          'step2.err.missingFields': '\u8BF7\u586B\u5199\u6240\u6709\u5FC5\u586B\u5B57\u6BB5\u3002',
          'step3.desc': '\u53EF\u9009\u62E9\u8FDE\u63A5\u6D88\u606F\u5E73\u53F0\u3002\u60A8\u53EF\u4EE5\u7A0D\u540E\u4ECE\u7BA1\u7406\u9762\u677F\u6DFB\u52A0\u9891\u9053\u3002',
          'step3.next': '\u4E0B\u4E00\u6B65\uFF1A\u6280\u80FD \u2192',
          'step3.catPopular': '\u70ED\u95E8',
          'step3.catMore': '\u66F4\u591A\u9891\u9053',
          'step4.desc': '\u9009\u62E9\u6280\u80FD\u6765\u589E\u5F3A\u60A8\u7684\u52A9\u7406\u3002\u60A8\u53EF\u4EE5\u7A0D\u540E\u518D\u6DFB\u52A0\u3002',
          'step4.defaultSkills': '\u9ED8\u8BA4\u6280\u80FD',
          'step4.searchPlaceholder': '\u641C\u7D22\u6280\u80FD...',
          'step4.noMatch': '\u6CA1\u6709\u7B26\u5408\u641C\u7D22\u7684\u6280\u80FD\u3002',
          'step4.bwcTitle': 'Build with Claude \u6280\u80FD',
          'step4.bwcBrowse': '\u6D4F\u89C8\u5168\u90E8 \u2192',
          'step4.bwcLoading': '\u6B63\u5728\u52A0\u8F7D\u6280\u80FD...',
          'step4.bwcEmpty': '\u76EE\u524D\u6CA1\u6709\u53EF\u7528\u7684\u6280\u80FD\u3002',
          'step4.bwcError': '\u65E0\u6CD5\u52A0\u8F7D Build with Claude \u6280\u80FD\u3002\u60A8\u53EF\u4EE5\u7A0D\u540E\u4ECE\u7BA1\u7406\u9762\u677F\u6DFB\u52A0\u3002',
          'step4.next': '\u4E0B\u4E00\u6B65\uFF1A\u90E8\u7F72 \u2192',
          'step4.filterPopular': '\u70ED\u95E8',
          'step5.deployBtn': '\u90E8\u7F72 OpenClaw',
          'step5.deploying': '\u6B63\u5728\u90E8\u7F72...',
          'step5.failed': '\u90E8\u7F72\u5931\u8D25',
          'step5.retry': '\u91CD\u8BD5',
          'step5.success.heading': 'OpenClaw \u5DF2\u542F\u52A8\uFF01',
          'step5.success.subtitle': '\u60A8\u7684 AI \u52A9\u7406\u5DF2\u51C6\u5907\u5C31\u7EEA\u3002',
          'step5.success.openPanel': '\u6253\u5F00\u7BA1\u7406\u9762\u677F',
          'step5.success.openDashboard': '\u6253\u5F00 OpenClaw \u7F51\u5173\u4EEA\u8868\u677F',
          'nav.back': '\u2190 \u4E0A\u4E00\u6B65',
          'review.provider': '\u63D0\u4F9B\u8005',
          'review.authMethod': '\u9A8C\u8BC1\u65B9\u5F0F',
          'review.persona': '\u52A9\u7406\u89D2\u8272',
          'review.channels': '\u9891\u9053',
          'review.skills': '\u6280\u80FD',
          'review.none': '\u65E0',
          'review.default': '\u9ED8\u8BA4',
          'review.skillCount': '{names}\uFF08\u5DF2\u9009 {count} \u4E2A\uFF09'
        },
        ja: {
          'pageTitle': 'OpenClaw \u30BB\u30C3\u30C8\u30A2\u30C3\u30D7',
          'configured.title': 'OpenClaw \u306F\u8A2D\u5B9A\u6E08\u307F\u3067\u3059',
          'configured.openPanel': '\u7BA1\u7406\u30D1\u30CD\u30EB\u3092\u958B\u304F',
          'configured.openDashboard': 'OpenClaw \u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3092\u958B\u304F',
          'configured.reconfigure': '\u6700\u521D\u304B\u3089\u518D\u8A2D\u5B9A',
          'configured.restoreBackup': '\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u304B\u3089\u5FA9\u5143',
          'configured.confirmReset': '\u73FE\u5728\u306E\u8A2D\u5B9A\u3092\u524A\u9664\u3057\u3001\u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u3092\u505C\u6B62\u3057\u307E\u3059\u3002\u3088\u308D\u3057\u3044\u3067\u3059\u304B\uFF1F',
          'configured.resetFailed': '\u30EA\u30BB\u30C3\u30C8\u5931\u6557\uFF1A{error}',
          'step1.restoreBackup': '\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u304B\u3089\u5FA9\u5143',
          'restore.confirmTitle': '\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u304B\u3089\u5FA9\u5143',
          'restore.confirmMessage': '\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u30D5\u30A1\u30A4\u30EB\u300C{filename}\u300D\u3067\u73FE\u5728\u306E\u8A2D\u5B9A\u3092\u7F6E\u304D\u63DB\u3048\u307E\u3059\u3002\u81EA\u52D5\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u304C\u5148\u306B\u4F5C\u6210\u3055\u308C\u307E\u3059\u3002\u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u304C\u518D\u8D77\u52D5\u3055\u308C\u307E\u3059\u3002',
          'restore.invalidFile': '.tar.gz\u3001.tgz\u3001\u307E\u305F\u306F .zip \u30D5\u30A1\u30A4\u30EB\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044',
          'restore.restoring': '\u5FA9\u5143\u4E2D...',
          'restore.success': '\u5FA9\u5143\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F\u3002\u30EA\u30ED\u30FC\u30C9\u3057\u307E\u3059...',
          'restore.failed': '\u5FA9\u5143\u5931\u6557\uFF1A{error}',
          'restore.error': '\u5FA9\u5143\u30A8\u30E9\u30FC\uFF1A{error}',
          'steps.welcome': '\u3088\u3046\u3053\u305D',
          'steps.provider': 'AI \u30D7\u30ED\u30D0\u30A4\u30C0',
          'steps.channels': '\u30C1\u30E3\u30CD\u30EB',
          'steps.skills': '\u30B9\u30AD\u30EB',
          'steps.deploy': '\u30C7\u30D7\u30ED\u30A4',
          'step1.heading': 'OpenClaw \u3078\u3088\u3046\u3053\u305D',
          'step1.subtitle': 'Telegram\u3001Discord\u3001Slack \u306A\u3069\u306B\u5BFE\u5FDC\u3057\u305F\u500B\u4EBA\u7528 AI \u30A2\u30B7\u30B9\u30BF\u30F3\u30C8',
          'step1.list1': 'AI \u30D7\u30ED\u30D0\u30A4\u30C0\u3092\u63A5\u7D9A',
          'step1.list2': '\u30E1\u30C3\u30BB\u30FC\u30B8\u30C1\u30E3\u30CD\u30EB\u3092\u8FFD\u52A0',
          'step1.list3': '\u30B9\u30AD\u30EB\u3092\u9078\u629E',
          'step1.list4': '\u30C7\u30D7\u30ED\u30A4\u3057\u3066\u30C1\u30E3\u30C3\u30C8\u958B\u59CB',
          'step1.beforeTitle': '\u59CB\u3081\u308B\u524D\u306B',
          'step1.beforeDesc': '\u5C11\u306A\u304F\u3068\u3082 1 \u3064\u306E\u30D7\u30ED\u30D0\u30A4\u30C0\u306E API \u30AD\u30FC\u304C\u5FC5\u8981\u3067\u3059\uFF1A',
          'step1.moreProviders': '+ \u4ED6 8 \u30D7\u30ED\u30D0\u30A4\u30C0',
          'step1.getStarted': '\u59CB\u3081\u308B \u2192',
          'step2.selectProvider': 'AI \u30D7\u30ED\u30D0\u30A4\u30C0\u3092\u9078\u629E',
          'step2.popular': '\u4EBA\u6C17',
          'step2.moreProviders': '\u305D\u306E\u4ED6\u306E\u30D7\u30ED\u30D0\u30A4\u30C0',
          'step2.authMethod': '\u8A8D\u8A3C\u65B9\u6CD5',
          'step2.apiKey': 'API \u30AD\u30FC',
          'step2.apiKeyPlaceholder': '\u30AD\u30FC\u307E\u305F\u306F\u30C8\u30FC\u30AF\u30F3\u3092\u5165\u529B...',
          'step2.apiKeyHint': '\u30AD\u30FC\u306F OpenClaw \u306B\u76F4\u63A5\u9001\u4FE1\u3055\u308C\u3001\u3053\u306E UI \u306B\u306F\u4FDD\u5B58\u3055\u308C\u307E\u305B\u3093\u3002',
          'step2.apiKeyHintLink': '\u4EE5\u4E0B\u3067\u30AD\u30FC\u3092\u53D6\u5F97\uFF1A',
          'step2.persona': '\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u30DA\u30EB\u30BD\u30CA\uFF08\u4EFB\u610F\uFF09',
          'step2.next': '\u6B21\u3078\uFF1A\u30C1\u30E3\u30CD\u30EB \u2192',
          'step2.err.noProvider': 'AI \u30D7\u30ED\u30D0\u30A4\u30C0\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
          'step2.err.noAuth': '\u8A8D\u8A3C\u65B9\u6CD5\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
          'step2.err.noKey': 'API \u30AD\u30FC\u307E\u305F\u306F\u30C8\u30FC\u30AF\u30F3\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
          'step2.err.missingFields': '\u3059\u3079\u3066\u306E\u5FC5\u9808\u9805\u76EE\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
          'step3.desc': '\u30E1\u30C3\u30BB\u30FC\u30B8\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306E\u63A5\u7D9A\u306F\u4EFB\u610F\u3067\u3059\u3002\u5F8C\u3067\u7BA1\u7406\u30D1\u30CD\u30EB\u304B\u3089\u8FFD\u52A0\u3067\u304D\u307E\u3059\u3002',
          'step3.next': '\u6B21\u3078\uFF1A\u30B9\u30AD\u30EB \u2192',
          'step3.catPopular': '\u4EBA\u6C17',
          'step3.catMore': '\u305D\u306E\u4ED6\u306E\u30C1\u30E3\u30CD\u30EB',
          'step4.desc': '\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3092\u5F37\u5316\u3059\u308B\u30B9\u30AD\u30EB\u3092\u9078\u629E\u3002\u5F8C\u3067\u8FFD\u52A0\u3067\u304D\u307E\u3059\u3002',
          'step4.defaultSkills': '\u30C7\u30D5\u30A9\u30EB\u30C8\u30B9\u30AD\u30EB',
          'step4.searchPlaceholder': '\u30B9\u30AD\u30EB\u3092\u691C\u7D22...',
          'step4.noMatch': '\u691C\u7D22\u306B\u4E00\u81F4\u3059\u308B\u30B9\u30AD\u30EB\u304C\u3042\u308A\u307E\u305B\u3093\u3002',
          'step4.bwcTitle': 'Build with Claude \u30B9\u30AD\u30EB',
          'step4.bwcBrowse': '\u3059\u3079\u3066\u898B\u308B \u2192',
          'step4.bwcLoading': '\u30B9\u30AD\u30EB\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D...',
          'step4.bwcEmpty': '\u73FE\u5728\u5229\u7528\u53EF\u80FD\u306A\u30B9\u30AD\u30EB\u306F\u3042\u308A\u307E\u305B\u3093\u3002',
          'step4.bwcError': 'Build with Claude \u30B9\u30AD\u30EB\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u5F8C\u3067\u7BA1\u7406\u30D1\u30CD\u30EB\u304B\u3089\u8FFD\u52A0\u3067\u304D\u307E\u3059\u3002',
          'step4.next': '\u6B21\u3078\uFF1A\u30C7\u30D7\u30ED\u30A4 \u2192',
          'step4.filterPopular': '\u4EBA\u6C17',
          'step5.deployBtn': 'OpenClaw \u3092\u30C7\u30D7\u30ED\u30A4',
          'step5.deploying': '\u30C7\u30D7\u30ED\u30A4\u4E2D...',
          'step5.failed': '\u30C7\u30D7\u30ED\u30A4\u5931\u6557',
          'step5.retry': '\u30EA\u30C8\u30E9\u30A4',
          'step5.success.heading': 'OpenClaw \u304C\u8D77\u52D5\u3057\u307E\u3057\u305F\uFF01',
          'step5.success.subtitle': 'AI \u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u306E\u6E96\u5099\u304C\u3067\u304D\u307E\u3057\u305F\u3002',
          'step5.success.openPanel': '\u7BA1\u7406\u30D1\u30CD\u30EB\u3092\u958B\u304F',
          'step5.success.openDashboard': 'OpenClaw \u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3092\u958B\u304F',
          'nav.back': '\u2190 \u623B\u308B',
          'review.provider': '\u30D7\u30ED\u30D0\u30A4\u30C0',
          'review.authMethod': '\u8A8D\u8A3C\u65B9\u6CD5',
          'review.persona': '\u30DA\u30EB\u30BD\u30CA',
          'review.channels': '\u30C1\u30E3\u30CD\u30EB',
          'review.skills': '\u30B9\u30AD\u30EB',
          'review.none': '\u306A\u3057',
          'review.default': '\u30C7\u30D5\u30A9\u30EB\u30C8',
          'review.skillCount': '{names}\uFF08{count} \u500B\u9078\u629E\uFF09'
        },
        ko: {
          'pageTitle': 'OpenClaw \uC124\uC815',
          'configured.title': 'OpenClaw\uC774 \uC774\uBBF8 \uC124\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4',
          'configured.openPanel': '\uAD00\uB9AC \uD328\uB110 \uC5F4\uAE30',
          'configured.openDashboard': 'OpenClaw \uAC8C\uC774\uD2B8\uC6E8\uC774 \uB300\uC2DC\uBCF4\uB4DC \uC5F4\uAE30',
          'configured.reconfigure': '\uCC98\uC74C\uBD80\uD130 \uC7AC\uC124\uC815',
          'configured.restoreBackup': '\uBC31\uC5C5\uC5D0\uC11C \uBCF5\uC6D0',
          'configured.confirmReset': '\uD604\uC7AC \uC124\uC815\uC744 \uC0AD\uC81C\uD558\uACE0 \uAC8C\uC774\uD2B8\uC6E8\uC774\uB97C \uC911\uC9C0\uD569\uB2C8\uB2E4. \uACC4\uC18D\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?',
          'configured.resetFailed': '\uC7AC\uC124\uC815 \uC2E4\uD328: {error}',
          'step1.restoreBackup': '\uBC31\uC5C5\uC5D0\uC11C \uBCF5\uC6D0',
          'restore.confirmTitle': '\uBC31\uC5C5\uC5D0\uC11C \uBCF5\uC6D0',
          'restore.confirmMessage': '\uBC31\uC5C5 \uD30C\uC77C \u201C{filename}\u201D\uB85C \uD604\uC7AC \uC124\uC815\uC744 \uB300\uCCB4\uD569\uB2C8\uB2E4. \uC790\uB3D9 \uBC31\uC5C5\uC774 \uBA3C\uC800 \uC0DD\uC131\uB429\uB2C8\uB2E4. \uAC8C\uC774\uD2B8\uC6E8\uC774\uAC00 \uC7AC\uC2DC\uC791\uB429\uB2C8\uB2E4.',
          'restore.invalidFile': '.tar.gz, .tgz \uB610\uB294 .zip \uD30C\uC77C\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694',
          'restore.restoring': '\uBCF5\uC6D0 \uC911...',
          'restore.success': '\uBCF5\uC6D0\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uB4DC\uD569\uB2C8\uB2E4...',
          'restore.failed': '\uBCF5\uC6D0 \uC2E4\uD328: {error}',
          'restore.error': '\uBCF5\uC6D0 \uC624\uB958: {error}',
          'steps.welcome': '\uD658\uC601',
          'steps.provider': 'AI \uC81C\uACF5\uC790',
          'steps.channels': '\uCC44\uB110',
          'steps.skills': '\uC2A4\uD0AC',
          'steps.deploy': '\uBC30\uD3EC',
          'step1.heading': 'OpenClaw\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4',
          'step1.subtitle': 'Telegram, Discord, Slack \uB4F1\uC744 \uC9C0\uC6D0\uD558\uB294 \uAC1C\uC778 AI \uC5B4\uC2DC\uC2A4\uD134\uD2B8',
          'step1.list1': 'AI \uC81C\uACF5\uC790 \uC5F0\uACB0',
          'step1.list2': '\uBA54\uC2DC\uC9C0 \uCC44\uB110 \uCD94\uAC00',
          'step1.list3': '\uC2A4\uD0AC \uC120\uD0DD',
          'step1.list4': '\uBC30\uD3EC\uD558\uACE0 \uCC44\uD305 \uC2DC\uC791',
          'step1.beforeTitle': '\uC2DC\uC791\uD558\uAE30 \uC804\uC5D0',
          'step1.beforeDesc': '\uCD5C\uC18C \uD558\uB098\uC758 \uC81C\uACF5\uC790 API \uD0A4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4:',
          'step1.moreProviders': '+ 8\uAC1C \uCD94\uAC00 \uC81C\uACF5\uC790',
          'step1.getStarted': '\uC2DC\uC791\uD558\uAE30 \u2192',
          'step2.selectProvider': 'AI \uC81C\uACF5\uC790\uB97C \uC120\uD0DD\uD558\uC138\uC694',
          'step2.popular': '\uC778\uAE30',
          'step2.moreProviders': '\uAE30\uD0C0 \uC81C\uACF5\uC790',
          'step2.authMethod': '\uC778\uC99D \uBC29\uBC95',
          'step2.apiKey': 'API \uD0A4',
          'step2.apiKeyPlaceholder': '\uD0A4 \uB610\uB294 \uD1A0\uD070\uC744 \uC785\uB825\uD558\uC138\uC694...',
          'step2.apiKeyHint': '\uD0A4\uB294 OpenClaw\uC5D0 \uC9C1\uC811 \uC804\uC1A1\uB418\uBA70 \uC774 UI\uC5D0 \uC800\uC7A5\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
          'step2.apiKeyHintLink': '\uB2E4\uC74C\uC5D0\uC11C \uD0A4\uB97C \uBC1B\uC73C\uC138\uC694: ',
          'step2.persona': '\uC5D0\uC774\uC804\uD2B8 \uD398\uB974\uC18C\uB098 (\uC120\uD0DD)',
          'step2.next': '\uB2E4\uC74C: \uCC44\uB110 \u2192',
          'step2.err.noProvider': 'AI \uC81C\uACF5\uC790\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.',
          'step2.err.noAuth': '\uC778\uC99D \uBC29\uBC95\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.',
          'step2.err.noKey': 'API \uD0A4 \uB610\uB294 \uD1A0\uD070\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.',
          'step2.err.missingFields': '\uBAA8\uB4E0 \uD544\uC218 \uD56D\uBAA9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.',
          'step3.desc': '\uBA54\uC2DC\uC9C0 \uD50C\uB7AB\uD3FC \uC5F0\uACB0\uC740 \uC120\uD0DD \uC0AC\uD56D\uC785\uB2C8\uB2E4. \uB098\uC911\uC5D0 \uAD00\uB9AC \uD328\uB110\uC5D0\uC11C \uCD94\uAC00\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
          'step3.next': '\uB2E4\uC74C: \uC2A4\uD0AC \u2192',
          'step3.catPopular': '\uC778\uAE30',
          'step3.catMore': '\uAE30\uD0C0 \uCC44\uB110',
          'step4.desc': '\uC5B4\uC2DC\uC2A4\uD134\uD2B8\uB97C \uAC15\uD654\uD560 \uC2A4\uD0AC\uC744 \uC120\uD0DD\uD558\uC138\uC694. \uB098\uC911\uC5D0 \uCD94\uAC00\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
          'step4.defaultSkills': '\uAE30\uBCF8 \uC2A4\uD0AC',
          'step4.searchPlaceholder': '\uC2A4\uD0AC \uAC80\uC0C9...',
          'step4.noMatch': '\uAC80\uC0C9\uACFC \uC77C\uCE58\uD558\uB294 \uC2A4\uD0AC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
          'step4.bwcTitle': 'Build with Claude \uC2A4\uD0AC',
          'step4.bwcBrowse': '\uBAA8\uB450 \uBCF4\uAE30 \u2192',
          'step4.bwcLoading': '\uC2A4\uD0AC \uB85C\uB529 \uC911...',
          'step4.bwcEmpty': '\uD604\uC7AC \uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uC2A4\uD0AC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
          'step4.bwcError': 'Build with Claude \uC2A4\uD0AC\uC744 \uB85C\uB4DC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB098\uC911\uC5D0 \uAD00\uB9AC \uD328\uB110\uC5D0\uC11C \uCD94\uAC00\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
          'step4.next': '\uB2E4\uC74C: \uBC30\uD3EC \u2192',
          'step4.filterPopular': '\uC778\uAE30',
          'step5.deployBtn': 'OpenClaw \uBC30\uD3EC',
          'step5.deploying': '\uBC30\uD3EC \uC911...',
          'step5.failed': '\uBC30\uD3EC \uC2E4\uD328',
          'step5.retry': '\uC7AC\uC2DC\uB3C4',
          'step5.success.heading': 'OpenClaw\uC774 \uC2E4\uD589 \uC911\uC785\uB2C8\uB2E4!',
          'step5.success.subtitle': 'AI \uC5B4\uC2DC\uC2A4\uD134\uD2B8\uAC00 \uC900\uBE44\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
          'step5.success.openPanel': '\uAD00\uB9AC \uD328\uB110 \uC5F4\uAE30',
          'step5.success.openDashboard': 'OpenClaw \uAC8C\uC774\uD2B8\uC6E8\uC774 \uB300\uC2DC\uBCF4\uB4DC \uC5F4\uAE30',
          'nav.back': '\u2190 \uB4A4\uB85C',
          'review.provider': '\uC81C\uACF5\uC790',
          'review.authMethod': '\uC778\uC99D \uBC29\uBC95',
          'review.persona': '\uD398\uB974\uC18C\uB098',
          'review.channels': '\uCC44\uB110',
          'review.skills': '\uC2A4\uD0AC',
          'review.none': '\uC5C6\uC74C',
          'review.default': '\uAE30\uBCF8\uAC12',
          'review.skillCount': '{names} ({count}\uAC1C \uC120\uD0DD)'
        }
      };

      ${getI18nBootstrapJS(null, {
        langSelectorIds: ['wizard', 'configured'],
        onChangeCallback: `
        buildProviderGrid();
        buildChannelCards();
        buildSkillGrid();
        if (bwcSkillsData.length > 0) renderBwcSkills();
        if (currentStep === 5) populateReview();`
      })}

      var AVAILABLE_SKILLS = [
        { slug: 'weather', emoji: '\\u{1F324}\\uFE0F', name: 'Weather', desc: 'Get weather and forecasts, no API key needed', category: 'Utilities', popular: true },
        { slug: 'github', emoji: '\\u{1F419}', name: 'GitHub', desc: 'Interact with GitHub via the gh CLI', category: 'Developer', popular: true },
        { slug: 'summarize', emoji: '\\u{1F9FE}', name: 'Summarize', desc: 'Summarize URLs, PDFs, and videos', category: 'Productivity', popular: true },
        { slug: 'coding-agent', emoji: '\\u{1F4BB}', name: 'Coding Agent', desc: 'Run coding agents like Claude Code or Codex', category: 'Developer', popular: true },
        { slug: 'openai-image-gen', emoji: '\\u{1F3A8}', name: 'Image Generation', desc: 'Generate images with OpenAI DALL-E', category: 'AI & Creative', popular: true },
        { slug: 'notion', emoji: '\\u{1F4DD}', name: 'Notion', desc: 'Read and manage Notion pages and databases', category: 'Productivity', popular: false },
        { slug: 'obsidian', emoji: '\\u{1F4D3}', name: 'Obsidian', desc: 'Search and manage Obsidian vault notes', category: 'Productivity', popular: false },
        { slug: 'trello', emoji: '\\u{1F4CB}', name: 'Trello', desc: 'Manage Trello boards, lists, and cards', category: 'Productivity', popular: false },
        { slug: 'spotify-player', emoji: '\\u{1F3B5}', name: 'Spotify', desc: 'Control Spotify playback from chat', category: 'Entertainment', popular: false },
        { slug: 'session-logs', emoji: '\\u{1F4CA}', name: 'Session Logs', desc: 'View and search conversation logs', category: 'Utilities', popular: false },
        { slug: 'model-usage', emoji: '\\u{1F4C8}', name: 'Model Usage', desc: 'Track AI model token usage and costs', category: 'Utilities', popular: false }
      ];

      // Luminance check: lighten dark brand colors for visibility on dark background
      function ensureVisibleColor(hex, fallback) {
        if (!hex) return fallback || '#a1a1aa';
        var c = hex.replace('#', '');
        if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
        var r = parseInt(c.substr(0,2), 16) / 255;
        var g = parseInt(c.substr(2,2), 16) / 255;
        var b = parseInt(c.substr(4,2), 16) / 255;
        r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
        var L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return L < 0.1 ? (fallback || '#a1a1aa') : hex;
      }

      var providerHelpLinks = {
        'Anthropic': 'https://console.anthropic.com/settings/keys',
        'OpenAI': 'https://platform.openai.com/api-keys',
        'Google / Gemini': 'https://aistudio.google.com/apikey',
        'OpenRouter': 'https://openrouter.ai/keys',
        'Venice AI': 'https://venice.ai/settings/api',
        'Together AI': 'https://api.together.xyz/settings/api-keys',
        'Vercel AI Gateway': 'https://vercel.com/docs/ai-gateway',
        'Moonshot AI': 'https://platform.moonshot.cn/console/api-keys',
        'Kimi Coding': 'https://platform.moonshot.ai/',
        'Z.AI (GLM)': 'https://z.ai/model-api',
        'Cloudflare AI Gateway': 'https://dash.cloudflare.com/',
        'MiniMax': 'https://platform.minimax.io',
        'OpenCode Zen': 'https://opencode.ai',
        'Ollama': null
      };

      // ========== Step Navigation ==========
      function updateStepIndicator() {
        for (var i = 1; i <= 5; i++) {
          var stepEl = document.querySelector('.wizard-step[data-step="' + i + '"]');
          var circleSpan = stepEl.querySelector('.step-circle span');
          stepEl.classList.remove('active', 'completed', 'disabled');
          if (i === currentStep) {
            stepEl.classList.add('active');
            circleSpan.textContent = String(i);
          } else if (i < currentStep) {
            stepEl.classList.add('completed');
            circleSpan.textContent = '\\u2713';
          } else {
            stepEl.classList.add('disabled');
            circleSpan.textContent = String(i);
          }
        }
        for (var j = 1; j <= 4; j++) {
          var conn = document.querySelector('.step-connector[data-connector="' + j + '"]');
          if (j < currentStep) {
            conn.classList.add('completed');
          } else {
            conn.classList.remove('completed');
          }
        }
      }

      window.goToStep = function(n) {
        if (wizardLocked) return;
        if (n < 1 || n > 5) return;

        document.getElementById('step-' + currentStep).classList.remove('active');
        currentStep = n;
        if (n > highestStep) highestStep = n;
        document.getElementById('step-' + currentStep).classList.add('active');
        updateStepIndicator();

        if (n === 5) populateReview();
      };

      window.clickStep = function(n) {
        if (wizardLocked) return;
        if (n <= highestStep) {
          if (n < currentStep) {
            goToStep(n);
          } else if (n > currentStep) {
            if (currentStep === 2 && n > 2) {
              validateAndGoToStep(n);
            } else {
              goToStep(n);
            }
          }
        }
      };

      function isNoSecretChoice() {
        if (selectedProviderIndex === null || selectedAuthChoice === null) return false;
        var opts = authGroups[selectedProviderIndex].options;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].value === selectedAuthChoice) return !!(opts[i].noSecret);
        }
        return false;
      }

      function isSecretOptional() {
        if (selectedProviderIndex === null || selectedAuthChoice === null) return false;
        var opts = authGroups[selectedProviderIndex].options;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].value === selectedAuthChoice) return !!(opts[i].secretOptional);
        }
        return false;
      }

      function isDeviceCodeChoice() {
        if (selectedProviderIndex === null || selectedAuthChoice === null) return false;
        var opts = authGroups[selectedProviderIndex].options;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].value === selectedAuthChoice) return !!(opts[i].deviceCode);
        }
        return false;
      }

      window.validateAndGoToStep = function(n) {
        if (selectedProviderIndex === null) {
          showStep2Error(t('step2.err.noProvider'));
          return;
        }
        if (selectedAuthChoice === null) {
          showStep2Error(t('step2.err.noAuth'));
          return;
        }
        if (selectedAuthChoice !== 'ollama' && !isNoSecretChoice() && !isSecretOptional()) {
          var secretVal = document.getElementById('secret-input').value.trim();
          if (!secretVal) {
            showStep2Error(t('step2.err.noKey'));
            return;
          }
        }
        // Validate extra fields if present
        var extraInputs = document.querySelectorAll('.extra-field-input');
        for (var k = 0; k < extraInputs.length; k++) {
          if (!extraInputs[k].value.trim() && extraInputs[k].getAttribute('data-optional') !== 'true') {
            showStep2Error(t('step2.err.missingFields'));
            return;
          }
        }
        hideStep2Error();
        goToStep(n);
      };

      function showStep2Error(msg) {
        var el = document.getElementById('step2-error');
        el.textContent = msg;
        el.classList.add('show');
      }
      function hideStep2Error() {
        document.getElementById('step2-error').classList.remove('show');
      }

      // ========== Provider Selection ==========
      function buildProviderGrid() {
        var popularGrid = document.getElementById('provider-grid-popular');
        var moreGrid = document.getElementById('provider-grid-more');
        popularGrid.textContent = '';
        moreGrid.textContent = '';
        authGroups.forEach(function(g, idx) {
          var card = document.createElement('div');
          card.className = 'provider-card';
          card.setAttribute('data-idx', idx);
          card.onclick = function() { selectProvider(idx); };

          var iconDiv = document.createElement('div');
          iconDiv.className = 'provider-icon';
          if (g.icon && g.icon.svg) {
            var svgNS = 'http://www.w3.org/2000/svg';
            var svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', ensureVisibleColor(g.icon.color || '#ffffff', '#a1a1aa'));
            var path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', g.icon.svg);
            svg.appendChild(path);
            iconDiv.appendChild(svg);
          } else if (g.emoji) {
            var span = document.createElement('span');
            span.className = 'emoji-fallback';
            span.textContent = g.emoji;
            iconDiv.appendChild(span);
          }
          card.appendChild(iconDiv);

          var name = document.createElement('div');
          name.className = 'provider-name';
          name.textContent = g.provider;
          card.appendChild(name);

          if (g.description) {
            var desc = document.createElement('div');
            desc.className = 'provider-desc';
            desc.textContent = g.description;
            card.appendChild(desc);
          }

          if (idx === selectedProviderIndex) card.classList.add('selected');
          var targetGrid = (g.category === 'popular') ? popularGrid : moreGrid;
          targetGrid.appendChild(card);
        });
      }

      window.selectProvider = function(idx) {
        selectedProviderIndex = idx;
        selectedAuthChoice = null;

        var cards = document.querySelectorAll('.provider-card');
        for (var i = 0; i < cards.length; i++) {
          cards[i].classList.toggle('selected', parseInt(cards[i].getAttribute('data-idx')) === idx);
        }

        var group = authGroups[idx];
        var authGroup = document.getElementById('auth-methods-group');
        var radioGroup = document.getElementById('auth-radio-group');

        radioGroup.textContent = '';

        if (group.options.length === 1) {
          authGroup.style.display = 'none';
          selectedAuthChoice = group.options[0].value;
        } else {
          authGroup.style.display = 'block';
          group.options.forEach(function(opt) {
            var label = document.createElement('label');
            label.className = 'radio-option';
            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'auth-method';
            radio.value = opt.value;
            radio.onchange = function() {
              selectedAuthChoice = opt.value;
              updateSecretField();
            };
            label.appendChild(radio);
            var textWrap = document.createElement('span');
            textWrap.className = 'radio-text';
            var lbl = document.createElement('span');
            lbl.className = 'radio-label';
            lbl.textContent = opt.label;
            textWrap.appendChild(lbl);
            if (opt.hint) {
              var hintEl = document.createElement('span');
              hintEl.className = 'radio-hint';
              hintEl.textContent = opt.hint;
              textWrap.appendChild(hintEl);
            }
            label.appendChild(textWrap);
            radioGroup.appendChild(label);
          });
        }

        updateSecretField();
        hideStep2Error();
      };

      function updateSecretField() {
        var secretGroup = document.getElementById('secret-group');
        var secretHint = document.getElementById('secret-hint');

        // Remove any previously rendered extra fields
        var oldExtra = document.getElementById('extra-fields-container');
        if (oldExtra) oldExtra.parentNode.removeChild(oldExtra);

        // Find current option object
        var currentOpt = null;
        if (selectedProviderIndex !== null && selectedAuthChoice !== null) {
          var opts = authGroups[selectedProviderIndex].options;
          for (var i = 0; i < opts.length; i++) {
            if (opts[i].value === selectedAuthChoice) {
              currentOpt = opts[i];
              break;
            }
          }
        }

        if (selectedAuthChoice === 'ollama' || isNoSecretChoice()) {
          secretGroup.style.display = 'none';
        } else if (selectedAuthChoice !== null) {
          secretGroup.style.display = 'block';
          // Update label to show "(optional)" when the API key is not required
          var secretLabel = document.getElementById('secret-label');
          if (secretLabel) {
            secretLabel.textContent = isSecretOptional() ? t('step2.apiKey') + ' (optional)' : t('step2.apiKey');
          }
          var group = authGroups[selectedProviderIndex];
          var link = providerHelpLinks[group.provider];
          // Build hint text safely using DOM methods
          secretHint.textContent = '';
          if (link) {
            secretHint.appendChild(document.createTextNode(t('step2.apiKeyHintLink')));
            var a = document.createElement('a');
            a.href = link;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = link.replace('https://', '').split('/')[0];
            secretHint.appendChild(a);
          } else {
            secretHint.textContent = t('step2.apiKeyHint');
          }

          // Render extra fields if the option has them
          if (currentOpt && currentOpt.extraFields) {
            var container = document.createElement('div');
            container.id = 'extra-fields-container';
            container.className = 'extra-fields-container';
            for (var j = 0; j < currentOpt.extraFields.length; j++) {
              var ef = currentOpt.extraFields[j];
              var fg = document.createElement('div');
              fg.className = 'form-group';
              var lbl = document.createElement('label');
              lbl.className = 'form-label';
              lbl.textContent = ef.label + (ef.optional ? ' (optional)' : '');
              fg.appendChild(lbl);
              var inp = document.createElement('input');
              inp.type = ef.type || 'text';
              inp.className = 'form-input extra-field-input';
              inp.setAttribute('data-field-id', ef.id);
              if (ef.optional) inp.setAttribute('data-optional', 'true');
              inp.placeholder = ef.placeholder || '';
              fg.appendChild(inp);
              if (ef.hint) {
                var hintEl = document.createElement('p');
                hintEl.className = 'form-hint';
                hintEl.textContent = ef.hint;
                fg.appendChild(hintEl);
              }
              container.appendChild(fg);
            }
            secretGroup.parentNode.insertBefore(container, secretGroup.nextSibling);
          }
        } else {
          if (selectedProviderIndex !== null) {
            secretGroup.style.display = 'block';
            // Update hint to match selected provider
            var group = authGroups[selectedProviderIndex];
            var link = providerHelpLinks[group.provider];
            secretHint.textContent = '';
            if (link) {
              secretHint.appendChild(document.createTextNode(t('step2.apiKeyHintLink')));
              var a = document.createElement('a');
              a.href = link;
              a.target = '_blank';
              a.rel = 'noopener';
              a.textContent = link.replace('https://', '').split('/')[0];
              secretHint.appendChild(a);
            } else {
              secretHint.textContent = t('step2.apiKeyHint');
            }
          } else {
            secretGroup.style.display = 'none';
          }
        }
      }

      // ========== Channels ==========
      var CATEGORY_LABEL_KEYS = { popular: 'step3.catPopular', more: 'step3.catMore' };
      var CATEGORY_ORDER = ['popular', 'more'];

      function buildChannelCards() {
        var container = document.getElementById('channel-cards-container');
        // Save field values before clearing
        var savedFieldValues = {};
        channelGroups.forEach(function(ch) {
          if (ch.fields) {
            ch.fields.forEach(function(f) {
              var inp = document.getElementById('channel-field-' + ch.name + '-' + f.id);
              if (inp) savedFieldValues[ch.name + '-' + f.id] = inp.value;
            });
          }
        });
        container.textContent = '';

        CATEGORY_ORDER.forEach(function(cat) {
          var channels = channelGroups.filter(function(ch) { return ch.category === cat; });
          if (channels.length === 0) return;

          var label = document.createElement('h4');
          label.className = 'channel-category-label';
          label.textContent = t(CATEGORY_LABEL_KEYS[cat] || cat);
          container.appendChild(label);

          channels.forEach(function(ch) {
            var card = document.createElement('div');
            card.className = 'channel-card';
            card.id = 'channel-' + ch.name;

            // Header
            var header = document.createElement('div');
            header.className = 'channel-header';
            header.onclick = function() { toggleChannel(ch.name); };

            var headerLeft = document.createElement('div');
            headerLeft.className = 'channel-header-left';

            // Icon
            var iconDiv = document.createElement('div');
            iconDiv.className = 'channel-icon';
            if (ch.icon && ch.icon.svg) {
              var svgNS = 'http://www.w3.org/2000/svg';
              var svg = document.createElementNS(svgNS, 'svg');
              svg.setAttribute('viewBox', '0 0 24 24');
              svg.setAttribute('fill', ensureVisibleColor(ch.icon.color || '#ffffff', '#a1a1aa'));
              var path = document.createElementNS(svgNS, 'path');
              path.setAttribute('d', ch.icon.svg);
              svg.appendChild(path);
              iconDiv.appendChild(svg);
            } else {
              var emojiSpan = document.createElement('span');
              emojiSpan.className = 'emoji-fallback';
              emojiSpan.textContent = ch.emoji || '';
              iconDiv.appendChild(emojiSpan);
            }
            headerLeft.appendChild(iconDiv);

            var nameSpan = document.createElement('span');
            nameSpan.className = 'channel-name-text';
            nameSpan.textContent = ch.displayName;
            headerLeft.appendChild(nameSpan);

            header.appendChild(headerLeft);

            // Toggle switch
            var toggleLabel = document.createElement('label');
            toggleLabel.className = 'toggle-switch';
            toggleLabel.onclick = function(e) { e.stopPropagation(); };
            var toggleInput = document.createElement('input');
            toggleInput.type = 'checkbox';
            toggleInput.id = 'toggle-' + ch.name;
            toggleInput.onchange = function() { toggleChannel(ch.name, this.checked); };
            var slider = document.createElement('span');
            slider.className = 'toggle-slider';
            toggleLabel.appendChild(toggleInput);
            toggleLabel.appendChild(slider);
            header.appendChild(toggleLabel);

            card.appendChild(header);

            // Body (form fields, note, help links)
            var body = document.createElement('div');
            body.className = 'channel-body';

            if (ch.fields && ch.fields.length > 0) {
              ch.fields.forEach(function(field, fi) {
                var fg = document.createElement('div');
                fg.className = 'form-group';
                if (fi === ch.fields.length - 1 && !ch.helpUrl && !ch.helpText && !ch.note) {
                  fg.style.marginBottom = '0';
                }
                var lbl = document.createElement('label');
                lbl.className = 'form-label';
                lbl.textContent = field.label;
                fg.appendChild(lbl);
                var inp = document.createElement('input');
                inp.id = 'channel-field-' + ch.name + '-' + field.id;
                inp.type = field.type || 'text';
                inp.className = 'form-input';
                inp.placeholder = field.placeholder || '';
                fg.appendChild(inp);
                body.appendChild(fg);
              });
            }

            if (ch.note) {
              var noteDiv = document.createElement('div');
              noteDiv.className = 'channel-note';
              noteDiv.textContent = ch.note;
              body.appendChild(noteDiv);
            }

            if (ch.helpText || ch.helpUrl) {
              var help = document.createElement('p');
              help.className = 'channel-help';
              if (ch.helpText && ch.helpText.text) {
                help.appendChild(document.createTextNode(ch.helpText.text + ' '));
                var htLink = document.createElement('a');
                htLink.href = ch.helpText.linkUrl;
                htLink.target = '_blank';
                htLink.rel = 'noopener';
                htLink.textContent = ch.helpText.linkText;
                help.appendChild(htLink);
              }
              if (ch.helpUrl) {
                if (ch.helpText) help.appendChild(document.createTextNode(' \\u00b7 '));
                var docsLink = document.createElement('a');
                docsLink.href = ch.helpUrl;
                docsLink.target = '_blank';
                docsLink.rel = 'noopener';
                docsLink.textContent = ch.helpText ? 'Full guide' : 'Setup guide';
                help.appendChild(docsLink);
              }
              body.appendChild(help);
            }

            card.appendChild(body);
            container.appendChild(card);

            // Restore enabled state
            if (enabledChannels[ch.name]) {
              card.classList.add('enabled');
              var toggle = document.getElementById('toggle-' + ch.name);
              if (toggle) toggle.checked = true;
            }
            // Restore field values
            if (ch.fields) {
              ch.fields.forEach(function(f) {
                var key = ch.name + '-' + f.id;
                if (savedFieldValues[key] !== undefined) {
                  var inp = document.getElementById('channel-field-' + key);
                  if (inp) inp.value = savedFieldValues[key];
                }
              });
            }
          });
        });
      }

      window.toggleChannel = function(name, forceState) {
        var isEnabled;
        if (typeof forceState === 'boolean') {
          isEnabled = forceState;
        } else {
          isEnabled = !enabledChannels[name];
        }
        enabledChannels[name] = isEnabled;

        var checkbox = document.getElementById('toggle-' + name);
        if (checkbox) checkbox.checked = isEnabled;

        var card = document.getElementById('channel-' + name);
        if (card) {
          if (isEnabled) {
            card.classList.add('enabled');
          } else {
            card.classList.remove('enabled');
          }
        }
      };

      // ========== Skills ==========
      function isSkillSelected(slug, source) {
        for (var i = 0; i < selectedSkills.length; i++) {
          if (selectedSkills[i].slug === slug && selectedSkills[i].source === source) return true;
        }
        return false;
      }

      function createSkillCard(skill, source) {
        var card = document.createElement('div');
        card.className = 'skill-card';
        if (isSkillSelected(skill.slug, source)) card.className += ' selected';
        card.setAttribute('data-slug', skill.slug);
        card.setAttribute('data-source', source);
        card.onclick = function() { toggleSkill(skill.slug, source); };

        var emoji = document.createElement('div');
        emoji.className = 'skill-emoji';
        emoji.textContent = skill.emoji || '\\u{1F9E9}';
        card.appendChild(emoji);

        var name = document.createElement('div');
        name.className = 'skill-name';
        name.textContent = skill.name;
        card.appendChild(name);

        var desc = document.createElement('div');
        desc.className = 'skill-desc';
        desc.textContent = skill.desc || skill.description || '';
        card.appendChild(desc);

        if (skill.category) {
          var badge = document.createElement('div');
          badge.className = 'skill-badge';
          badge.textContent = skill.category;
          card.appendChild(badge);
        }

        return card;
      }

      function buildFilterChips(containerId, categories, activeFilter, onSelect) {
        var container = document.getElementById(containerId);
        container.textContent = '';

        var allFilters = ['Popular'].concat(categories);
        allFilters.forEach(function(label) {
          var chip = document.createElement('span');
          chip.className = 'skill-filter-chip';
          if (activeFilter === label) chip.className += ' active';
          chip.textContent = label === 'Popular' ? t('step4.filterPopular') : label;
          chip.onclick = function() {
            // Toggle: clicking active chip deselects (shows all)
            onSelect(activeFilter === label ? null : label);
          };
          container.appendChild(chip);
        });
      }

      function getDefaultCategories() {
        var cats = {};
        AVAILABLE_SKILLS.forEach(function(s) { if (s.category) cats[s.category] = true; });
        return Object.keys(cats);
      }

      function buildSkillGrid() {
        var grid = document.getElementById('skill-grid-default');
        var emptyEl = document.getElementById('default-skill-empty');
        grid.textContent = '';

        // Build filter chips
        buildFilterChips('default-skill-filters', getDefaultCategories(), defaultSkillFilter, function(filter) {
          defaultSkillFilter = filter;
          buildSkillGrid();
        });

        // Filter skills
        var filtered = AVAILABLE_SKILLS.filter(function(skill) {
          if (defaultSkillFilter === 'Popular') return skill.popular;
          if (defaultSkillFilter) return skill.category === defaultSkillFilter;
          return true;
        });
        if (defaultSkillSearch) {
          var q = defaultSkillSearch.toLowerCase();
          filtered = filtered.filter(function(skill) {
            return skill.name.toLowerCase().indexOf(q) !== -1 || skill.desc.toLowerCase().indexOf(q) !== -1;
          });
        }

        // Render
        filtered.forEach(function(skill) {
          grid.appendChild(createSkillCard(skill, 'default'));
        });

        emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
      }

      // Fetch and render Build with Claude skills
      function fetchBwcSkills() {
        var loadingEl = document.getElementById('bwc-loading');

        fetch('/onboard/api/bwc-skills?password=' + encodeURIComponent(password))
          .then(function(res) { return res.json(); })
          .then(function(data) {
            loadingEl.style.display = 'none';
            var items = data.plugins || [];
            if (items.length === 0) {
              loadingEl.textContent = t('step4.bwcEmpty');
              loadingEl.style.display = 'block';
              return;
            }
            bwcSkillsData = items;
            document.getElementById('bwc-skill-search').style.display = 'block';
            renderBwcSkills();
          })
          .catch(function() {
            loadingEl.textContent = t('step4.bwcError');
          });
      }

      function getBwcCategories() {
        var cats = {};
        bwcSkillsData.forEach(function(s) { if (s.category) cats[s.category] = true; });
        return Object.keys(cats);
      }

      function renderBwcSkills() {
        var grid = document.getElementById('skill-grid-bwc');
        var emptyEl = document.getElementById('bwc-skill-empty');
        grid.textContent = '';

        // Build filter chips
        buildFilterChips('bwc-skill-filters', getBwcCategories(), bwcSkillFilter, function(filter) {
          bwcSkillFilter = filter;
          renderBwcSkills();
        });

        // Filter skills
        var filtered = bwcSkillsData.filter(function(skill, idx) {
          if (bwcSkillFilter === 'Popular') return idx < BWC_POPULAR_COUNT;
          if (bwcSkillFilter) return skill.category === bwcSkillFilter;
          return true;
        });
        if (bwcSkillSearch) {
          var q = bwcSkillSearch.toLowerCase();
          filtered = filtered.filter(function(skill) {
            return skill.name.toLowerCase().indexOf(q) !== -1 || (skill.description || '').toLowerCase().indexOf(q) !== -1;
          });
        }

        // Render
        filtered.forEach(function(skill) {
          grid.appendChild(createSkillCard(skill, 'buildwithclaude'));
        });

        emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
      }

      window.toggleSkill = function(slug, source) {
        var idx = -1;
        for (var i = 0; i < selectedSkills.length; i++) {
          if (selectedSkills[i].slug === slug && selectedSkills[i].source === source) {
            idx = i;
            break;
          }
        }
        if (idx === -1) {
          selectedSkills.push({ slug: slug, source: source });
        } else {
          selectedSkills.splice(idx, 1);
        }
        var card = document.querySelector('.skill-card[data-slug="' + slug + '"][data-source="' + source + '"]');
        if (card) {
          card.classList.toggle('selected', idx === -1);
        }
      };

      // ========== Review ==========
      function populateReview() {
        var container = document.getElementById('review-summary');
        container.textContent = '';

        function addRow(label, value) {
          var row = document.createElement('div');
          row.className = 'review-row';
          var l = document.createElement('span');
          l.className = 'review-label';
          l.textContent = label;
          var v = document.createElement('span');
          v.className = 'review-value';
          v.textContent = value;
          row.appendChild(l);
          row.appendChild(v);
          container.appendChild(row);
        }

        if (selectedProviderIndex !== null) {
          addRow(t('review.provider'), authGroups[selectedProviderIndex].provider);
        }
        if (selectedAuthChoice) {
          var authLabel = selectedAuthChoice;
          if (selectedProviderIndex !== null) {
            var opts = authGroups[selectedProviderIndex].options;
            for (var i = 0; i < opts.length; i++) {
              if (opts[i].value === selectedAuthChoice) {
                authLabel = opts[i].label;
                break;
              }
            }
          }
          addRow(t('review.authMethod'), authLabel);
        }

        var flow = document.getElementById('flow-select').value;
        addRow(t('review.persona'), flow || t('review.default'));

        var channelNames = [];
        channelGroups.forEach(function(ch) {
          if (enabledChannels[ch.name]) channelNames.push(ch.displayName);
        });
        addRow(t('review.channels'), channelNames.length > 0 ? channelNames.join(', ') : t('review.none'));

        if (selectedSkills.length > 0) {
          var skillNames = selectedSkills.map(function(item) {
            // Check default skills first
            for (var i = 0; i < AVAILABLE_SKILLS.length; i++) {
              if (AVAILABLE_SKILLS[i].slug === item.slug) return AVAILABLE_SKILLS[i].name;
            }
            // Check BWC skills data array
            for (var j = 0; j < bwcSkillsData.length; j++) {
              if (bwcSkillsData[j].slug === item.slug) return bwcSkillsData[j].name;
            }
            return item.slug;
          });
          addRow(t('review.skills'), t('review.skillCount', { names: skillNames.join(', '), count: selectedSkills.length }));
        } else {
          addRow(t('review.skills'), t('review.none'));
        }
      }

      // ========== Deploy ==========
      window.deploy = function() {
        wizardLocked = true;

        // Interactive device-code pairing (ChatGPT/Codex) can't run through the
        // non-interactive /onboard/api/run endpoint — drive it via the PTY terminal instead.
        if (isDeviceCodeChoice()) {
          runDeviceCodePairing();
          return;
        }

        var deployArea = document.getElementById('deploy-area');
        var progress = document.getElementById('deploy-progress');
        var success = document.getElementById('deploy-success');
        var spinner = document.getElementById('deploy-spinner');
        var statusEl = document.getElementById('deploy-status');
        var logEl = document.getElementById('deploy-log');
        var retryBtn = document.getElementById('retry-btn');
        var backBtn = document.getElementById('step5-back');

        deployArea.style.display = 'none';
        success.style.display = 'none';
        progress.style.display = 'block';
        spinner.classList.remove('error');
        statusEl.textContent = t('step5.deploying');
        logEl.textContent = '';
        retryBtn.classList.add('hidden');
        backBtn.disabled = true;

        var extraFieldValues = {};
        var extraInputs = document.querySelectorAll('.extra-field-input');
        for (var k = 0; k < extraInputs.length; k++) {
          extraFieldValues[extraInputs[k].getAttribute('data-field-id')] = extraInputs[k].value.trim();
        }

        // Build channels array from enabled channels
        var channelsPayload = [];
        channelGroups.forEach(function(ch) {
          if (!enabledChannels[ch.name]) return;
          var fields = {};
          if (ch.fields) {
            ch.fields.forEach(function(f) {
              var inp = document.getElementById('channel-field-' + ch.name + '-' + f.id);
              if (inp && inp.value.trim()) fields[f.id] = inp.value.trim();
            });
          }
          channelsPayload.push({ name: ch.name, fields: fields });
        });

        var payload = {
          authChoice: selectedAuthChoice,
          authSecret: (selectedAuthChoice !== 'ollama' && !isNoSecretChoice()) ? document.getElementById('secret-input').value.trim() : '',
          extraFieldValues: extraFieldValues,
          flow: document.getElementById('flow-select').value,
          channels: channelsPayload,
          skills: selectedSkills
        };

        fetch('/onboard/api/run?password=' + encodeURIComponent(password), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.logs) {
            logEl.textContent = data.logs.join('\\n');
          }
          if (data.success) {
            progress.style.display = 'none';
            success.style.display = 'block';
            document.getElementById('step5-nav').style.display = 'none';
          } else {
            spinner.classList.add('error');
            statusEl.textContent = t('step5.failed');
            retryBtn.classList.remove('hidden');
            backBtn.disabled = false;
            wizardLocked = false;
          }
        })
        .catch(function(err) {
          logEl.textContent += '\\nError: ' + err.message;
          spinner.classList.add('error');
          statusEl.textContent = t('step5.failed');
          retryBtn.classList.remove('hidden');
          backBtn.disabled = false;
          wizardLocked = false;
        });
      };

      window.retryDeploy = function() {
        deploy();
      };

      // ========== Codex device-code pairing ==========
      var pairWs = null;
      var pairTerm = null;
      var pairFit = null;
      var pairBuf = '';
      var pairUrlFound = false;
      var pairCodeFound = false;

      function stripAnsi(s) {
        return s.replace(/\\x1b\\[[0-9;?]*[A-Za-z]/g, '').replace(/\\x1b\\][^\\x07]*(\\x07|\\x1b\\\\)/g, '');
      }

      function setPairStatus(msg, cls) {
        var el = document.getElementById('pair-status');
        if (!el) return;
        el.textContent = msg;
        el.className = 'pair-status' + (cls ? ' ' + cls : '');
      }

      function parsePairOutput(text) {
        pairBuf += stripAnsi(text);
        if (pairBuf.length > 20000) pairBuf = pairBuf.slice(-20000);
        if (!pairUrlFound) {
          var m = pairBuf.match(/https?:\\/\\/[^\\s"'<>]*codex\\/device[^\\s"'<>]*/i) ||
                  pairBuf.match(/https?:\\/\\/auth\\.openai\\.com\\/[^\\s"'<>]+/i);
          if (m) { document.getElementById('pair-url').href = m[0]; pairUrlFound = true; }
        }
        if (!pairCodeFound) {
          var cm = pairBuf.match(/Code:\\s*([A-Z0-9]{3,}-?[A-Z0-9]{2,})/i);
          if (cm) {
            var c = document.getElementById('pair-code');
            c.textContent = cm[1];
            c.className = 'pair-code';
            pairCodeFound = true;
            setPairStatus('Waiting for you to approve in your browser…');
          }
        }
      }

      window.runDeviceCodePairing = function() {
        document.getElementById('deploy-area').style.display = 'none';
        document.getElementById('deploy-progress').style.display = 'none';
        document.getElementById('deploy-success').style.display = 'none';
        document.getElementById('device-pairing').style.display = 'block';
        var nav = document.getElementById('step5-nav');
        if (nav) nav.style.display = 'none';
        var doneLinks = document.getElementById('pair-done-links');
        if (doneLinks) doneLinks.style.display = 'none';
        var retry = document.getElementById('pair-retry-btn');
        if (retry) retry.classList.add('hidden');

        pairBuf = ''; pairUrlFound = false; pairCodeFound = false;
        var codeEl = document.getElementById('pair-code');
        codeEl.textContent = 'starting…'; codeEl.className = 'pair-code waiting';
        document.getElementById('pair-url').href = '#';
        setPairStatus('Connecting to the pairing terminal…');

        try {
          if (pairTerm) { try { pairTerm.dispose(); } catch (e) {} pairTerm = null; }
          pairTerm = new Terminal({
            cursorBlink: true, fontSize: 13, scrollback: 1000, convertEol: true,
            fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
            theme: { background: '#12141a', foreground: '#e4e4e7' }
          });
          pairFit = new FitAddon.FitAddon();
          pairTerm.loadAddon(pairFit);
          var termEl = document.getElementById('device-term');
          clearElement(termEl);
          pairTerm.open(termEl);
          try { pairFit.fit(); } catch (e) {}
          pairTerm.onData(function(d) {
            if (pairWs && pairWs.readyState === WebSocket.OPEN) {
              pairWs.send(JSON.stringify({ type: 'input', data: d }));
            }
          });
        } catch (e) {
          setPairStatus('Could not load terminal (' + e.message + ') — pairing details will still appear below.', 'error');
        }

        var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        var wsUrl = proto + '//' + location.host + '/onboard/ws?cmd=codex-device&password=' + encodeURIComponent(password);
        pairWs = new WebSocket(wsUrl);
        pairWs.onopen = function() {
          setPairStatus('Starting device pairing…');
          if (pairTerm && pairFit) {
            try { pairWs.send(JSON.stringify({ type: 'resize', cols: pairTerm.cols, rows: pairTerm.rows })); } catch (e) {}
          }
        };
        pairWs.onmessage = function(ev) {
          var msg;
          try { msg = JSON.parse(ev.data); } catch (e) { if (pairTerm) pairTerm.write(ev.data); return; }
          if (msg.type === 'output') {
            if (pairTerm) pairTerm.write(msg.data);
            parsePairOutput(msg.data);
          } else if (msg.type === 'exit') {
            if (msg.code === 0) {
              finishDevicePairing();
            } else {
              setPairStatus('Pairing ended (exit code ' + msg.code + '). You can retry.', 'error');
              var rb = document.getElementById('pair-retry-btn');
              if (rb) rb.classList.remove('hidden');
              wizardLocked = false;
            }
          }
        };
        pairWs.onerror = function() {
          setPairStatus('Connection error. You can retry.', 'error');
          var rb = document.getElementById('pair-retry-btn');
          if (rb) rb.classList.remove('hidden');
          wizardLocked = false;
        };
      };

      function finishDevicePairing() {
        setPairStatus('Pairing approved — applying configuration…', 'success');
        // Point the primary model at the openai-codex provider, then restart the gateway so
        // it loads the new openai-codex OAuth profile.
        fetch('/lite/api/config?password=' + encodeURIComponent(password))
          .then(function(r) { return r.json(); })
          .then(function(cfg) {
            cfg = cfg || {};
            cfg.agents = cfg.agents || {};
            cfg.agents.defaults = cfg.agents.defaults || {};
            cfg.agents.defaults.model = cfg.agents.defaults.model || {};
            var primary = String(cfg.agents.defaults.model.primary || '');
            // openclaw quickstart writes "openai/<model>" for the ChatGPT/Codex
            // subscription, but the openai provider needs an OpenAI API key. Re-point to
            // the openai-codex provider (the device-code subscription) while keeping the
            // model id quickstart chose (e.g. gpt-5.5). Codex models live under openai-codex
            // (gpt-5.5, gpt-5.4, ...), so do NOT invent a model id.
            if (primary.indexOf('openai-codex/') !== 0) {
              var newPrimary = primary.indexOf('openai/') === 0
                ? 'openai-codex/' + primary.slice('openai/'.length)
                : 'openai-codex/gpt-5.5';
              cfg.agents.defaults.model.primary = newPrimary;
              return fetch('/lite/api/config?password=' + encodeURIComponent(password), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cfg)
              }).then(function() {});
            }
          })
          .catch(function() {})
          .then(function() {
            return fetch('/lite/api/gateway/restart?password=' + encodeURIComponent(password), { method: 'POST' });
          })
          .catch(function() {})
          .then(function() {
            setPairStatus('Done! Codex is connected and the gateway has restarted.', 'success');
            var dl = document.getElementById('pair-done-links');
            if (dl) dl.style.display = 'flex';
            wizardLocked = false;
          });
      }

      // ========== Restore from Backup ==========
      function showRestoreToast(message, type) {
        var toast = document.getElementById('restore-toast');
        toast.textContent = message;
        toast.className = 'restore-toast ' + type;
        requestAnimationFrame(function() {
          toast.classList.add('visible');
        });
        setTimeout(function() {
          toast.classList.remove('visible');
        }, 3500);
      }

      function clearElement(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
      }

      function showRestoreOverlay() {
        var overlay = document.getElementById('restore-overlay');
        var steps = document.getElementById('restore-steps');
        var spinner = document.getElementById('restore-spinner');
        var doneBtn = document.getElementById('restore-done-btn');
        clearElement(steps);
        spinner.style.display = 'inline-block';
        doneBtn.classList.add('hidden');
        overlay.classList.remove('hidden');
      }

      window.closeRestoreOverlay = function() {
        document.getElementById('restore-overlay').classList.add('hidden');
      };

      window.handleRestoreFile = function(input) {
        var file = input.files && input.files[0];
        if (!file) return;
        var name = file.name.toLowerCase();
        if (!name.endsWith('.tar.gz') && !name.endsWith('.tgz') && !name.endsWith('.zip')) {
          showRestoreToast(t('restore.invalidFile'), 'error');
          input.value = '';
          return;
        }
        var msg = t('restore.confirmMessage', { filename: file.name });
        if (!confirm(msg)) {
          input.value = '';
          return;
        }
        performRestore(file);
        input.value = '';
      };

      function performRestore(file) {
        showRestoreOverlay();
        var stepsEl = document.getElementById('restore-steps');
        var spinner = document.getElementById('restore-spinner');
        var doneBtn = document.getElementById('restore-done-btn');

        var reader = new FileReader();
        reader.onload = function() {
          fetch('/lite/api/restore?password=' + encodeURIComponent(password), {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': file.name },
            body: reader.result
          })
            .then(function(res) { return res.json(); })
            .then(function(data) {
              spinner.style.display = 'none';
              clearElement(stepsEl);
              (data.steps || []).forEach(function(step) {
                var div = document.createElement('div');
                div.className = data.success ? 'step-ok' : 'step-err';
                div.textContent = step;
                stepsEl.appendChild(div);
              });
              if (data.success) {
                showRestoreToast(t('restore.success'), 'success');
                setTimeout(function() { location.reload(); }, 2000);
              } else {
                showRestoreToast(t('restore.failed', { error: data.error || 'unknown' }), 'error');
                doneBtn.classList.remove('hidden');
              }
            })
            .catch(function(err) {
              spinner.style.display = 'none';
              showRestoreToast(t('restore.error', { error: err.message }), 'error');
              var div = document.createElement('div');
              div.className = 'step-err';
              div.textContent = err.message;
              stepsEl.appendChild(div);
              doneBtn.classList.remove('hidden');
            });
        };
        reader.readAsArrayBuffer(file);
      }

      // ========== Already Configured: Reconfigure ==========
      window.showReconfigureWarning = function() {
        if (!confirm(t('configured.confirmReset'))) return;

        fetch('/onboard/api/reset?password=' + encodeURIComponent(password), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.success) {
            var configured = document.getElementById('configured-view');
            var wizard = document.getElementById('wizard-view');
            if (configured) configured.classList.add('hidden');
            wizard.classList.remove('hidden');
            currentStep = 1;
            highestStep = 1;
            updateStepIndicator();
          } else {
            alert(t('configured.resetFailed', { error: data.error || 'Unknown error' }));
          }
        })
        .catch(function(err) {
          alert('Error: ' + err.message);
        });
      };

      // ========== Initialize ==========
      document.addEventListener('DOMContentLoaded', function() {
        initLanguage();
        updateLangSelectorUI();
        applyTranslations();

        buildProviderGrid();
        buildChannelCards();
        buildSkillGrid();
        fetchBwcSkills();
        updateStepIndicator();

        document.getElementById('default-skill-search').addEventListener('input', function(e) {
          defaultSkillSearch = e.target.value;
          buildSkillGrid();
        });
        document.getElementById('bwc-skill-search').addEventListener('input', function(e) {
          bwcSkillSearch = e.target.value;
          renderBwcSkills();
        });
      });
    })();
  </script>
</body>
</html>`;
}
