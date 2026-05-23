/**
 * Terminal WebSocket server for OpenClaw onboarding
 *
 * Creates a PTY-based terminal that runs `openclaw onboard` and bridges it
 * to the browser via WebSocket, enabling full interactive CLI experience.
 */

import pty from 'node-pty';
import { WebSocketServer } from 'ws';
import { parse as parseUrl } from 'url';
import { parse as parseCookie } from './cookie-parser.js';

// Track active terminal sessions
const activeSessions = new Map();

// Allowlist of commands the /onboard/ws terminal may run, keyed by the `cmd` query param.
// SECURITY: values are fixed arg arrays — the client only selects a key, never the args,
// so arbitrary commands can never be injected via the query string.
const ONBOARD_COMMANDS = {
  // Default: the full interactive onboarding wizard.
  default: ['onboard'],
  // ChatGPT/Codex device-code pairing. Interactive-only (refuses --non-interactive);
  // prints a URL + code the user approves in a browser while the container polls.
  'codex-device': ['onboard', '--flow', 'quickstart', '--accept-risk', '--auth-choice', 'openai-codex-device-code']
};

/**
 * Write data to PTY one character at a time to simulate keyboard input.
 * This prevents CLI rendering issues (e.g. @clack/prompts) when pasting
 * multi-character strings that arrive as a single write.
 */
function writeToPtyCharByChar(ptyProcess, data, delayMs = 5) {
  let i = 0;
  function next() {
    if (i < data.length) {
      ptyProcess.write(data[i]);
      i++;
      if (i < data.length) {
        setTimeout(next, delayMs);
      }
    }
  }
  next();
}

/**
 * Verify WebSocket authentication from cookies or query params
 * @param {http.IncomingMessage} req - HTTP request
 * @param {string} password - Required password
 * @returns {boolean} True if authenticated
 */
function verifyAuth(req, password) {
  // Check query parameter
  const url = parseUrl(req.url, true);
  if (url.query.password === password) {
    return true;
  }

  // Check cookie
  const cookies = parseCookie(req.headers.cookie || '');
  if (cookies.openclaw_auth === password) {
    return true;
  }

  return false;
}

/**
 * Create a WebSocket server for terminal sessions
 * @param {http.Server} httpServer - HTTP server to attach to
 * @param {string} password - Setup password for authentication
 * @returns {WebSocketServer} The WebSocket server instance
 */
export function createTerminalServer(httpServer, password) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrade requests
  httpServer.on('upgrade', (req, socket, head) => {
    const url = parseUrl(req.url, true);

    // Only handle /onboard/ws and /lite/ws endpoints
    if (url.pathname !== '/onboard/ws' && url.pathname !== '/lite/ws') {
      return; // Let other handlers (like proxy) handle it
    }

    // Verify authentication
    if (!verifyAuth(req, password)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  // Handle new WebSocket connections
  wss.on('connection', (ws, req) => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    console.log(`[terminal] New session: ${sessionId}`);

    const stateDir = process.env.OPENCLAW_STATE_DIR || '/data/.openclaw';
    const workspaceDir = process.env.OPENCLAW_WORKSPACE_DIR || '/data/workspace';

    // Determine command based on WebSocket path and (for /onboard/ws) an allowlisted cmd.
    const parsedUrl = parseUrl(req.url, true);
    const isUITerminal = parsedUrl.pathname === '/lite/ws';
    let command;
    let args;
    if (isUITerminal) {
      command = '/bin/bash';
      args = [];
    } else {
      // /onboard/ws: fixed command set only — never interpolate user input into spawn.
      // Each cmd maps to a hardcoded openclaw arg list.
      command = 'openclaw';
      args = ONBOARD_COMMANDS[parsedUrl.query.cmd] || ONBOARD_COMMANDS.default;
    }

    // Spawn process in a PTY
    const ptyProcess = pty.spawn(command, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: workspaceDir,
      env: {
        ...process.env,
        HOME: '/home/openclaw',
        OPENCLAW_STATE_DIR: stateDir,
        OPENCLAW_WORKSPACE_DIR: workspaceDir,
        OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN || '',
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        // Force interactive mode
        FORCE_COLOR: '1'
      }
    });

    activeSessions.set(sessionId, { ws, pty: ptyProcess });

    console.log(`[terminal] Started ${command} ${args.join(' ')} (PID: ${ptyProcess.pid})`);

    // Send PTY output to WebSocket
    ptyProcess.onData((data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`[terminal] Process exited (code: ${exitCode}, signal: ${signal})`);

      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'exit',
          code: exitCode,
          signal
        }));
      }

      activeSessions.delete(sessionId);
    });

    // Handle WebSocket messages (user input)
    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message.toString());

        switch (msg.type) {
          case 'input':
            if (msg.data.length > 1) {
              // Paste-like input: write char by char to avoid CLI rendering issues
              writeToPtyCharByChar(ptyProcess, msg.data);
            } else {
              ptyProcess.write(msg.data);
            }
            break;

          case 'resize':
            // Resize PTY
            if (msg.cols && msg.rows) {
              ptyProcess.resize(msg.cols, msg.rows);
            }
            break;

          default:
            console.log(`[terminal] Unknown message type: ${msg.type}`);
        }
      } catch (err) {
        // Handle raw string input (fallback)
        ptyProcess.write(message.toString());
      }
    });

    // Handle WebSocket close
    ws.on('close', () => {
      console.log(`[terminal] Session closed: ${sessionId}`);

      // Kill PTY process if still running
      try {
        ptyProcess.kill();
      } catch {
        // Already dead
      }

      activeSessions.delete(sessionId);
    });

    // Handle WebSocket errors
    ws.on('error', (err) => {
      console.error(`[terminal] WebSocket error: ${err.message}`);
    });
  });

  return wss;
}

/**
 * Get count of active terminal sessions
 * @returns {number} Number of active sessions
 */
export function getActiveSessionCount() {
  return activeSessions.size;
}

/**
 * Close all active terminal sessions
 */
export function closeAllSessions() {
  for (const [sessionId, session] of activeSessions) {
    console.log(`[terminal] Closing session: ${sessionId}`);
    try {
      session.pty.kill();
    } catch {
      // Already dead
    }
    try {
      session.ws.close();
    } catch {
      // Already closed
    }
  }
  activeSessions.clear();
}
