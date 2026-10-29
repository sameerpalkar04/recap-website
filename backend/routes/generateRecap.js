import express from 'express';
import { generateRecap } from '../services/recapService.js';
import { getSessionUser } from './auth.js';
import { saveUserRecap } from '../database/postgres.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  const { show, episode_no: episodeNo, season_no: seasonNo = 1 } = req.body ?? {};
  if (typeof show !== 'string' || !show.trim() || show.length > 120) {
    return res.status(400).json({ error: 'show is required and must be 120 characters or fewer' });
  }
  if (!Number.isInteger(Number(episodeNo)) || Number(episodeNo) < 1 || Number(episodeNo) > 1000) {
    return res.status(400).json({ error: 'episode_no must be a positive integer' });
  }
  if (!Number.isInteger(Number(seasonNo)) || Number(seasonNo) < 1 || Number(seasonNo) > 500) {
    return res.status(400).json({ error: 'season_no must be a positive integer' });
  }
  try {
    const user = getSessionUser(req);
    const result = await generateRecap({ show: show.trim(), episodeNo: Number(episodeNo), seasonNo: Number(seasonNo), cache: Boolean(user) });
    const recap = user ? await saveUserRecap(user.id, result.recap) : result.recap;
    res.json({ summary: recap.summary, recap, cached: result.cached, persisted: Boolean(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
