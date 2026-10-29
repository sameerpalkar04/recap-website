import { generateRecap } from '../services/recapService.js';

// Compatibility adapter for older callers; new API code should use recapService directly.
export default async function fetchEpisodeSummary(show, episodeNo, seasonNo = 1) {
  const result = await generateRecap({ show, seasonNo: Number(seasonNo), episodeNo: Number(episodeNo) });
  return result.recap.summary;
}
