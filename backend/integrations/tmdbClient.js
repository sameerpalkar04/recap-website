import axios from 'axios';

const tmdb = axios.create({ baseURL: 'https://api.themoviedb.org/3', timeout: 10_000 });

function ensureApiKey() {
  if (!process.env.TMDB_API_KEY) {
    const error = new Error('TMDB_API_KEY is not configured');
    error.status = 503;
    error.code = 'MISSING_TMDB_API_KEY';
    throw error;
  }
}

export async function getPopularShows(page = 1) {
  ensureApiKey();
  const { data } = await tmdb.get('/tv/popular', {
    params: { api_key: process.env.TMDB_API_KEY, language: 'en-US', page },
  });
  return data;
}

export async function searchShows(query, page = 1) {
  ensureApiKey();
  const { data } = await tmdb.get('/search/tv', {
    params: { api_key: process.env.TMDB_API_KEY, language: 'en-US', query, page },
  });
  return data;
}
