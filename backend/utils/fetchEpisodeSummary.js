import 'dotenv/config';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
      (ep) => ep.season < season_no || (ep.season === season_no && ep.number <= episode_no)
    );

    console.log(`Episodes included: ${selectedEpisodes.length}`);

    if (selectedEpisodes.length === 0) {
      return `No episodes found for ${show} up to S${season_no}E${episode_no}.`;
    }

    // Build raw recap
    let rawRecap = `Recap of ${show} (S1E1 → S${season_no}E${episode_no}):\n\n`;

    const seasonsMap = new Map();
    for (const ep of selectedEpisodes) {
      const plainSummary = ep.summary
        ? ep.summary.replace(/<[^>]+>/g, '')
        : 'No summary available.';

      if (!seasonsMap.has(ep.season)) seasonsMap.set(ep.season, []);
      seasonsMap.get(ep.season).push(`E${ep.number}-${ep.name}: ${plainSummary}`);
    }

    for (const [season, episodesList] of [...seasonsMap.entries()].sort((a, b) => a[0] - b[0])) {
      rawRecap += `=== Season ${season} ===\n${episodesList.join('\n')}\n\n`;
    }

    // Send to Gemini for summarization
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an expert TV show analyst and recap writer.
Summarize the following episode descriptions in a detailed, engaging, and easy-to-read season-wise recap.
Include the following in the summary:
- Key plot developments
- Character arcs and relationships
- Themes or conflicts introduced or resolved
- Memorable moments or turning points
- Avoid spoilers for future seasons beyond the requested episode

Organize clearly by season and episode order, and make it read like a cohesive narrative rather than a list.

Episode data:

${rawRecap}
    `;

    const result = await model.generateContent(prompt);
    const aiSummary = result.response.text();

    return aiSummary.trim();
  } catch (err) {
    console.error('Error fetching episode summary:', err.message);
    return `Could not fetch recap for ${show} episode ${episode_no}.`;
  }
}

export default fetchEpisodeSummary;

