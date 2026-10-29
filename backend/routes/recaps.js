import express from 'express';
import { deleteUserRecap, listUserRecaps, saveUserRecap } from '../database/postgres.js';
import { generateRecap } from '../services/recapService.js';
import { getSessionUser } from './auth.js';

const router = express.Router();

function requireUser(req, res) {
  const user = getSessionUser(req);
  if (!user) res.status(401).json({ error: 'Sign in to access your recap library.' });
  return user;
}

router.post('/generate', async (req, res, next) => {
  const { show, season_no: seasonNo, episode_no: episodeNo } = req.body ?? {};
  const normalizedShow = typeof show === 'string' ? show.trim() : '';
  const season = Number(seasonNo ?? 1);
  const episode = Number(episodeNo);

  if (!normalizedShow || normalizedShow.length > 120) return res.status(400).json({ error: 'show is required and must be 120 characters or fewer' });
  if (!Number.isInteger(season) || season < 1 || season > 500) return res.status(400).json({ error: 'season_no must be a positive integer' });
  if (!Number.isInteger(episode) || episode < 1 || episode > 1000) return res.status(400).json({ error: 'episode_no must be a positive integer' });

  try {
    const user = getSessionUser(req);
    const result = await generateRecap({ show: normalizedShow, seasonNo: season, episodeNo: episode, cache: Boolean(user) });
    const recap = user ? await saveUserRecap(user.id, result.recap) : result.recap;
    return res.json({ summary: recap.summary, recap, cached: result.cached, persisted: Boolean(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/history', async (req, res, next) => {
  const user = requireUser(req, res);
  if (!user) return;
  try { return res.json({ recaps: await listUserRecaps(user.id) }); } catch (error) { return next(error); }
});

router.delete('/history/:recapId', async (req, res, next) => {
  const user = requireUser(req, res);
  if (!user) return;
  if (!/^[0-9a-f-]{36}$/i.test(req.params.recapId)) return res.status(400).json({ error: 'Invalid recap id.' });
  try { return res.json({ deleted: await deleteUserRecap(user.id, req.params.recapId) }); } catch (error) { return next(error); }
});

export default router;
