import { GoogleGenAI } from '@google/genai';

export async function generateEpisodeRecap(showName, episodes, seasonNo, episodeNo) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.status = 503;
    throw error;
  }

  const bySeason = new Map();
  for (const episode of episodes) {
    if (!bySeason.has(episode.season)) bySeason.set(episode.season, []);
    bySeason.get(episode.season).push(episode);
  }

  const seasonLimits = [...bySeason.entries()]
    .sort(([first], [second]) => first - second)
    .map(([season, seasonEpisodes]) => {
      const lines = seasonEpisodes.map((episode) => {
        const description = episode.summary === 'No summary available.' ? '' : `: ${episode.summary}`;
        return `E${episode.number} — ${episode.name}${description}`;
      });
      const completeSeason = season < seasonNo;
      return { season, completeSeason, text: `Season ${season}\n${lines.join('\n')}` };
    });
  const episodeText = seasonLimits.map((season) => season.text).join('\n\n');
  const pointLimits = seasonLimits
    .map(({ season, completeSeason }) => completeSeason
      ? `Season ${season}: write 8–10 concise plot bullets.`
      : `Season ${season}: write up to 10 concise plot bullets using only the supplied episodes; do not infer later events.`)
    .join('\n');

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = [
    `Create a spoiler-safe recap of ${showName}, covering only the episode descriptions provided below, through Season ${seasonNo}, Episode ${episodeNo}.`,
    '',
    'Scope and evidence rules:',
    '- The episode descriptions below are the complete and only source of plot facts. Do not use prior knowledge of the show, later episodes, season finales, or character arcs to fill gaps.',
    `- The requested endpoint is Season ${seasonNo}, Episode ${episodeNo}. For that season, include events from episodes 1–${episodeNo} only. Never describe what happens later in that season.`,
    '- Earlier seasons may be summarized only because their episode descriptions are included below.',
    '- If a detail is not explicitly supported by these descriptions, leave it out. Fewer accurate points are better than a complete-sounding season recap.',
    '',
    'Writing rules:',
    '- Return a season-by-season recap: one section for every season represented in the source, in chronological order, with a heading such as "Season 1".',
    '- Write only the main plot lines and turning points. Combine related events into a cohesive season arc; do not summarize episodes one by one.',
    '- Keep each bullet to one short sentence (about 12–18 words). No intro, conclusion, episode titles, minor subplots, or nested bullets.',
    `- ${pointLimits}`,
    '- Use fewer bullets if the supplied descriptions do not support the requested count. Never invent or infer plot points to fill a quota.',
    '- Output only season headings and bullet points.',
    '',
    'Episode descriptions (already limited to the requested endpoint):',
    episodeText,
  ].join('\n');
  const result = await client.interactions.create({
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    input: prompt,
  });
  const summary = result.output_text?.trim();
  if (!summary) throw new Error('Gemini returned an empty recap');
  return summary;
}
