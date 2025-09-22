const TMDB_API_KEY = 'adbe0cd227497821330c8d8a2d2d366b';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  overview: string;
}

export async function fetchPopularShows(): Promise<TVShow[]> {
  const res = await fetch(
    `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
  );
  const json = await res.json();
  return json.results;
}

export function getPosterUrl(poster_path: string | null): string {
  if (!poster_path) return '/placeholder.png';
  return `${IMAGE_BASE_URL}/${POSTER_SIZE}${poster_path}`;
}
