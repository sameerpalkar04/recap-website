import axios from 'axios';

/**
 * Fetches the exact episode summary using TVmaze API
 * @param {string} show - The name of the TV show
 * @param {number} episode_no - The episode number
 * @param {number} season_no - The season number
 * @returns {string} - Episode-specific recap
 */

async function fetchEpisodeSummary(show, episode_no, season_no = 1) {
  try {
    const searchRes = await axios.get(
      `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(show)}&embed=episodes`
    );

    const showData = searchRes.data;
    console.log('Fetched show name:', showData.name);

    const episodes = showData._embedded.episodes;
    console.log('Total episodes fetched:', episodes.length);

    const episode = episodes.find(ep => ep.season === season_no && ep.number === episode_no);
    console.log('Matching episode:', episode);

    if (!episode || !episode.summary) {
      return `No summary found for ${show} S${season_no}E${episode_no}.`;
    }

    const plainSummary = episode.summary.replace(/<[^>]+>/g, '');
    return `Recap of ${show} S${season_no}E${episode_no}:\n${plainSummary}`;
  } catch (err) {
    console.error('Error fetching episode summary:', err.message);
    return `Could not fetch recap for ${show} episode ${episode_no}.`;
  }
}

export default fetchEpisodeSummary;