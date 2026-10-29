import express from 'express';
import { getPopularShows, searchShows } from '../integrations/tmdbClient.js';

const router = express.Router();

function parsePage(value) {
  const page = Number(value ?? 1);
  return Number.isInteger(page) && page >= 1 && page <= 500 ? page : null;
}

router.get('/popular', async (req, res, next) => {
  const page = parsePage(req.query.page);
  if (!page) return res.status(400).json({ error: 'page must be an integer between 1 and 500' });
  try {
    res.json(await getPopularShows(page));
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const page = parsePage(req.query.page);
  if (!query || query.length > 120) return res.status(400).json({ error: 'q is required and must be 120 characters or fewer' });
  if (!page) return res.status(400).json({ error: 'page must be an integer between 1 and 500' });
  try {
    res.json(await searchShows(query, page));
  } catch (error) {
    next(error);
  }
});

export default router;
