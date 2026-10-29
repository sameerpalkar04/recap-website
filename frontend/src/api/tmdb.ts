import { rankShowsFuzzily } from './fuzzySearch';

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
export const POSTER_SIZE = 'w500';

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  overview: string;
}

interface ShowListResponse {
  results: TVShow[];
  page: number;
  total_pages: number;
}

async function fetchShowList(path: string): Promise<ShowListResponse> {
  const response = await fetch(path);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Show catalogue request failed (${response.status})`);
  return result as ShowListResponse;
}

export async function fetchPopularShows(page = 1): Promise<TVShow[]> {
  const result = await fetchShowList(`/api/shows/popular?page=${page}`);
  return result.results;
}

export function fetchPopularShowPage(page = 1): Promise<ShowListResponse> {
  return fetchShowList(`/api/shows/popular?page=${page}`);
}

export async function searchShows(query: string, page = 1): Promise<ShowListResponse> {
  const params = new URLSearchParams({ q: query, page: String(page) });
  const result = await fetchShowList(`/api/shows/search?${params}`);
  if (result.results.length) {
    return { ...result, results: rankShowsFuzzily(query, result.results) };
  }

  // When TMDB has no direct hit, search individual words and fuzzy-rank their titles.
  const normalizedQuery = query.toLocaleLowerCase().trim();
  const terms = [...new Set(normalizedQuery.split(/[^a-z0-9]+/).filter((word) => word.length >= 3 && word !== normalizedQuery))].slice(0, 3);
  let candidates = (await Promise.all(terms.map(async (term) => {
    const paramsForTerm = new URLSearchParams({ q: term, page: '1' });
    return (await fetchShowList(`/api/shows/search?${paramsForTerm}`)).results;
  }))).flat();

  // For a one-word typo, popular catalogue titles provide a small local candidate set.
  if (!candidates.length && normalizedQuery.length >= 3) {
    const popularPages = await Promise.all([1, 2, 3].map((popularPage) => fetchPopularShowPage(popularPage)));
    candidates = popularPages.flatMap((popularPage) => popularPage.results);
  }

  const uniqueCandidates = [...new Map(candidates.map((show) => [show.id, show])).values()];
  const matches = rankShowsFuzzily(query, uniqueCandidates, 0.45);
  return { ...result, results: matches, total_pages: matches.length ? 1 : 0, page: 1 };
}

export async function fetchShowByName(name: string): Promise<TVShow | null> {
  const result = await searchShows(name);
  return result.results[0] ?? null;
}

export function getPosterUrl(poster_path: string | null): string {
  if (!poster_path) return '/placeholder.png';
  return `${IMAGE_BASE_URL}/${POSTER_SIZE}${poster_path}`;
}
