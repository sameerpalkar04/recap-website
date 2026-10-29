import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { consumeGenerationAllowance, initializeCache } from './cache/recapCache.js';
import legacyRecapRouter from './routes/generateRecap.js';
import recapRouter from './routes/recaps.js';
import showsRouter from './routes/shows.js';
import authRouter from './routes/auth.js';
import { closeDatabase, initializeDatabase, isDatabaseReady } from './database/postgres.js';

const backendDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(backendDirectory, '.env') });
dotenv.config({ path: resolve(backendDirectory, '../.env') });
await initializeDatabase();
await initializeCache();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : false }));
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('x-request-id', req.requestId);
  const startedAt = Date.now();
  res.on('finish', () => console.info(JSON.stringify({
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    status: res.statusCode,
    durationMs: Date.now() - startedAt,
  })));
  next();
});

app.get('/health', (_req, res) => {
  const status = isDatabaseReady() ? 200 : 503;
  return res.status(status).json({ status: status === 200 ? 'ok' : 'degraded', database: isDatabaseReady() });
});
app.use(['/api/recaps/generate', '/generate-recap'], async (req, res, next) => {
  const allowance = await consumeGenerationAllowance(req.ip);
  if (!allowance.allowed) {
    res.setHeader('retry-after', String(allowance.retryAfter));
    return res.status(429).json({ error: 'Too many recap requests. Try again shortly.' });
  }
  next();
});
app.use('/api/auth', authRouter);
app.use('/api/recaps', recapRouter);
app.use('/api/shows', showsRouter);
app.use('/generate-recap', legacyRecapRouter);

app.use((err, _req, res, _next) => {
  if (err.code !== 'MISSING_TMDB_API_KEY') console.error('Request failed:', err.message);
  const status = err.status || (err.response ? 502 : 500);
  const message = err.code === 'MISSING_TMDB_API_KEY'
    ? 'TMDB_API_KEY is missing from the backend environment.'
    : status < 500 ? err.message : 'A service could not complete the request';
  res.status(status).json({ error: message });
});

const port = Number(process.env.PORT) || 3001;
console.info(`TMDB_API_KEY loaded: ${Boolean(process.env.TMDB_API_KEY)}`);
if (!process.env.TMDB_API_KEY) console.warn('TMDB_API_KEY is not configured; show catalogue endpoints will return 503.');
const server = app.listen(port, () => console.log(`Backend listening on port ${port}`));

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    const { closeCache } = await import('./cache/recapCache.js');
    await closeCache();
    await closeDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
