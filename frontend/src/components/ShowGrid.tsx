import { useEffect, useState } from 'react';
import { fetchPopularShows } from '../api/tmdb';
import type { TVShow } from '../api/tmdb';
import ShowCard from './ShowCard';

export default function ShowGrid() {
  const [shows, setShows] = useState<TVShow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPopularShows()
      .then((data) => setShows(data))
      .catch((err) => {
        console.error('Error fetching shows:', err);
        setError('Failed to load popular shows.');
      });
  }, []);

  if (error)
    return <div className="text-red-500 text-center mt-4">{error}</div>;

  return (
    <div className="bg-black min-h-screen pt-24 px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </div>
  );
}
