import { randomUUID } from 'node:crypto';
import { getCachedRecap, saveCachedRecap } from '../cache/recapCache.js';
import { fetchEpisodeData } from '../integrations/tvmazeClient.js';
import { generateEpisodeRecap } from '../providers/geminiRecapProvider.js';

export async function generateRecap({ show, seasonNo, episodeNo, cache = true }) {
  if (cache) {
    const cached = await getCachedRecap(show, seasonNo, episodeNo);
    if (cached) return { recap: cached, cached: true };
  }

  const { showName, episodes } = await fetchEpisodeData(show, seasonNo, episodeNo);
  if (episodes.length === 0) {
    const error = new Error(`No episodes found for ${show} through S${seasonNo}E${episodeNo}`);
    error.status = 404;
    throw error;
  }

  const summary = await generateEpisodeRecap(showName, episodes, seasonNo, episodeNo);
  if (cache) {
    const recap = await saveCachedRecap({ show: showName, seasonNo, episodeNo, summary });
    return { recap, cached: false };
  }
  return { recap: { id: randomUUID(), show: showName, seasonNo, episodeNo, summary, generatedAt: new Date().toISOString() }, cached: false };
}
