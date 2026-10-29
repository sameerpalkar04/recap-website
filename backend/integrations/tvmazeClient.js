import axios from 'axios';

const tvmaze = axios.create({ baseURL: 'https://api.tvmaze.com', timeout: 10_000 });

export async function fetchEpisodeData(show, seasonNo, episodeNo) {
  const { data } = await tvmaze.get('/singlesearch/shows', {
    params: { q: show, embed: 'episodes' },
  });

  const episodes = data?._embedded?.episodes ?? [];
  return {
    showName: data.name,
    episodes: episodes
      .filter((episode) => episode.season < seasonNo || (episode.season === seasonNo && episode.number <= episodeNo))
      .map((episode) => ({
        season: episode.season,
        number: episode.number,
        name: episode.name,
        summary: episode.summary?.replace(/<[^>]*>/g, '').trim() || 'No summary available.',
      })),
  };
}
