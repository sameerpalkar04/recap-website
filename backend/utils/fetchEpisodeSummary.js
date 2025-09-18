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
    console.log('Total episodes available:', episodes.length);

    const selectedEpisodes = episodes.filter(
      (ep)=>
        ep.season < season_no || (ep.season === season_no && ep.number <= episode_no)
    );

    console.log(`Episodes included: ${selectedEpisodes.length}`);

    if(selectedEpisodes.length === 0) {
      return `No episodes found for ${show} up to S${season_no}E${episode_no}.`;
    }

    // Group episodes season-wise
    const seasonsMap = new Map();

    for (const ep of selectedEpisodes) {
      const plainSummary = ep.summary 
        ? ep.summary.replace(/<[^>]+>/g, '')
        : 'No summary available.';

      const episodeRecap = `E${ep.number}-${ep.name}: \n${plainSummary}\n`;

      if(!seasonsMap.has(ep.season)) {
        seasonsMap.set(ep.season, []);
      }

      seasonsMap.get(ep.season).push(episodeRecap);
    }

    let recapOutput = `Recap of ${show} (S1E1 → S${season_no}E${episode_no}):\n\n`;

    for (const [season, episodesList] of [...seasonsMap.entries()].sort((a, b) => a[0] - b[0])) {
      recapOutput += `=== Season ${season} ===\n\n`;
      recapOutput += episodesList.join('');
      recapOutput += '\n';
    }

    return recapOutput.trim();
  } catch (err) {
    console.error('Error fetching episode summary:', err.message);
    return `Could not fetch recap for ${show} episode ${episode_no}.`;
  }
}

export default fetchEpisodeSummary;