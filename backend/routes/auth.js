import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { upsertGoogleUser } from '../database/postgres.js';

const router = Router();
const STATE_COOKIE = 'afterword_oauth_state';
const SESSION_COOKIE = 'afterword_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

function configReady() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.AUTH_SESSION_SECRET && process.env.GOOGLE_REDIRECT_URI && process.env.DATABASE_URL);
}

function secret() {
  return process.env.AUTH_SESSION_SECRET || '';
}

function sign(value) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function encodeSigned(value) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decodeSigned(value) {
  if (!value || !secret()) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((part) => {
    const index = part.indexOf('=');
    return index < 0 ? ['', ''] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function cookieOptions(maxAge) {
  const secure = process.env.AUTH_COOKIE_SECURE === 'true' || (process.env.AUTH_COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function authError(res, message) {
  return res.redirect(`${frontendUrl()}/login?error=${encodeURIComponent(message)}`);
}

router.get('/google', (req, res) => {
  if (!configReady()) return authError(res, 'Google sign in or account storage is not configured. Set the required environment values and try again.');

  const flow = req.query.flow === 'signup' ? 'signup' : 'login';
  const requestedNext = typeof req.query.next === 'string' ? req.query.next : '';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\') ? requestedNext : '';
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const encodedChallenge = createHash('sha256').update(verifier).digest('base64url');
  const signedState = encodeSigned({ state, verifier, flow, next, issuedAt: Date.now() });
  res.setHeader('Set-Cookie', `${STATE_COOKIE}=${encodeURIComponent(signedState)}; ${cookieOptions(600)}`);

  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: encodedChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  // Keep the verifier only in the signed, short-lived, HttpOnly state cookie.
  return res.redirect(url.toString());
});

router.get('/google/callback', async (req, res) => {
  const jar = cookies(req);
  const stateData = decodeSigned(jar[STATE_COOKIE]);
  res.setHeader('Set-Cookie', `${STATE_COOKIE}=; ${cookieOptions(0)}`);
  if (!configReady()) return authError(res, 'Google sign in or account storage is not configured. Set the required environment values and try again.');
  if (req.query.error) return authError(res, 'Google sign in was cancelled.');
  if (!stateData || stateData.state !== req.query.state || Date.now() - stateData.issuedAt > 10 * 60 * 1000) {
    return authError(res, 'The sign in request expired. Please try again.');
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(req.query.code || ''),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
        code_verifier: stateData.verifier,
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) throw new Error('Google token exchange failed');

    const profileResponse = await fetch(GOOGLE_PROFILE_URL, { headers: { authorization: `Bearer ${tokens.access_token}` } });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
      throw new Error('Google did not return a verified account');
    }

    const account = await upsertGoogleUser(profile);
    const session = encodeSigned({
      sub: account.id,
      email: account.email,
      name: account.name,
      picture: account.picture || '',
      exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    });
    res.append('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(session)}; ${cookieOptions(SESSION_SECONDS)}`);
    const nextPath = typeof stateData.next === 'string' && stateData.next.startsWith('/') && !stateData.next.startsWith('//') ? stateData.next : '';
    const callback = `${frontendUrl()}/auth/callback?status=success&flow=${stateData.flow}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ''}`;
    return res.redirect(callback);
  } catch (error) {
    console.error('Google OAuth callback failed:', error.message);
    return authError(res, 'Google sign in could not be completed. Please try again.');
  }
});

export function getSessionUser(req) {
  const payload = decodeSigned(cookies(req)[SESSION_COOKIE]);
  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return { id: payload.sub, email: payload.email, name: payload.name, picture: payload.picture };
}

router.get('/me', (req, res) => {
  return res.json({ user: getSessionUser(req) });
});

router.post('/logout', (_req, res) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${cookieOptions(0)}`);
  return res.json({ success: true });
});

export default router;
