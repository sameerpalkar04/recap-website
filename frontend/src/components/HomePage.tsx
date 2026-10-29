import { useEffect, useState } from 'react';
import Slideshow from './Slideshow';
import ShowRow from './ShowRow';
import { fetchPopularShows } from '../api/tmdb';
import type { TVShow } from '../api/tmdb';

export default function HomePage() {
  const [shows, setShows] = useState<TVShow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!loading) { setElapsedSeconds(0); return; }
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    fetchPopularShows().then(setShows).catch(() => setError('The show catalogue is temporarily unavailable.')).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Slideshow />
      <div className="show-row-wrapper">
        {error ? <p className="page-message" role="alert">{error}</p> : loading ? <div className="async-loader"><span className="async-line-loader" aria-hidden="true"><i /></span><p>Loading popular shows… · {elapsedSeconds}s elapsed</p></div> : <ShowRow title="Popular Shows" shows={shows} />}
      </div>
    </>
  );
}
