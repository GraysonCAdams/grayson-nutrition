const LOKI_URL = process.env.LOKI_URL || '';
const LOKI_USER = process.env.LOKI_USER || '';
const LOKI_TOKEN = process.env.LOKI_TOKEN || '';
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH_SIZE = 100;

const buffer = [];

function isEnabled() {
  return !!(LOKI_URL && LOKI_USER && LOKI_TOKEN);
}

function push(level, args) {
  if (!isEnabled()) return;

  const line = args
    .map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 0)))
    .join(' ');

  buffer.push({ ts: `${Date.now()}000000`, line: `[${level}] ${line}` });

  if (buffer.length >= MAX_BATCH_SIZE) {
    flush();
  }
}

async function flush() {
  if (buffer.length === 0) return;

  const entries = buffer.splice(0, buffer.length);
  const body = {
    streams: [
      {
        stream: { app: 'nutrition', env: process.env.LOCAL_MODE === 'true' ? 'local' : 'prod' },
        values: entries.map((e) => [e.ts, e.line]),
      },
    ],
  };

  try {
    const auth = Buffer.from(`${LOKI_USER}:${LOKI_TOKEN}`).toString('base64');
    await fetch(`${LOKI_URL}/loki/api/v1/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Silently drop
  }
}

if (isEnabled()) {
  const origLog = console.log.bind(console);
  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);

  console.log = (...args) => { origLog(...args); push('info', args); };
  console.error = (...args) => { origError(...args); push('error', args); };
  console.warn = (...args) => { origWarn(...args); push('warn', args); };

  setInterval(flush, FLUSH_INTERVAL_MS);
  process.on('beforeExit', () => flush());
  process.on('SIGTERM', () => { flush().finally(() => process.exit(0)); });

  origLog('[loki] Shipping logs to Grafana Cloud');
} else {
  console.log('[loki] Disabled (LOKI_URL/LOKI_USER/LOKI_TOKEN not set)');
}
