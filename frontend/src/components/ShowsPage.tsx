import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ShowCard from './ShowCard';
import ShowAutocomplete from './ShowAutocomplete';
import { fetchPopularShowPage, searchShows } from '../api/tmdb';
import type { TVShow } from '../api/tmdb';

export default function ShowsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeQuery = searchParams.get('q')?.trim() ?? '';
  const [shows, setShows] = useState<TVShow[]>([]);
  const [query, setQuery] = useState(routeQuery);
  const [activeQuery, setActiveQuery] = useState(routeQuery);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setQuery(routeQuery);
    setActiveQuery(routeQuery);
    setPage(1);
  }, [routeQuery]);

  useEffect(() => {
    if (!loading) { setElapsedSeconds(0); return; }
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const request = activeQuery
      ? searchShows(activeQuery, page)
      : fetchPopularShowPage(page);
    request.then((result) => {
      if (!active) return;
      setShows(result.results);
      setTotalPages(Math.min(result.total_pages || 1, 500));
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load shows.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [activeQuery, page]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applySearch(query);
  }

  function applySearch(value: string) {
    const term = value.trim();
    setQuery(term);
    setActiveQuery(term);
    setPage(1);
    setSearchParams(term ? { q: term } : {});
  }

  function handleSelectShow(show: TVShow) {
    applySearch(show.name);
  }

  function clearSearch() {
    applySearch('');
  }

  return (
    <section className="catalog-page">
      <p className="eyebrow">Browse the catalogue</p>
      <h1 className="page-title">TV Shows</h1>
      <p className="page-intro">Find a show, pick an episode, and get caught up.</p>
      <form className="catalog-search" onSubmit={handleSearch}>
        <Search size={18} aria-hidden="true" />
        <ShowAutocomplete
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelectShow}
          onSearch={applySearch}
          placeholder="Search TV shows"
          ariaLabel="Search TV shows"
          className="catalog-autocomplete"
          inputClassName="catalog-autocomplete-input"
        />
        <button type="submit">Search</button>
        {activeQuery && <button type="button" className="text-button" onClick={clearSearch}>Clear</button>}
      </form>
      <div className="catalog-heading">
        <h2>{activeQuery ? `Results for “${activeQuery}”` : 'Popular right now'}</h2>
        <span>{shows.length ? `${shows.length} shows on this page` : ''}</span>
      </div>
      {loading ? <div className="async-loader"><span className="async-line-loader" aria-hidden="true"><i /></span><p>Loading shows… · {elapsedSeconds}s elapsed</p></div> : error ? <p className="page-message" role="alert">{error}</p> : shows.length ? (
        <div className="catalog-grid">
          {shows.map((show) => <ShowCard key={show.id} show={show} />)}
        </div>
      ) : <p className="page-message">No shows found. Try another title.</p>}
      {!loading && !error && totalPages > 1 && (
        <nav className="pagination" aria-label="Show catalogue pages">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </nav>
      )}
    </section>
  );
}
