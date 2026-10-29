import { useEffect, useId, useState } from 'react';
import { getPosterUrl, searchShows } from '../api/tmdb';
import type { TVShow } from '../api/tmdb';

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (show: TVShow) => void;
  onSearch: (query: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  inputClassName?: string;
}

export default function ShowAutocomplete({
  query,
  onQueryChange,
  onSelect,
  onSearch,
  placeholder,
  ariaLabel,
  className = '',
  inputClassName = '',
}: Props) {
  const [suggestions, setSuggestions] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const listId = useId();

  useEffect(() => {
    const term = query.trim();
    setSuggestions([]);
    setActiveIndex(-1);
    if (term.length < 2) {
      setLoading(false);
      setOpen(false);
      return;
    }

    let current = true;
    setOpen(true);
    setLoading(true);
    const timeoutId = window.setTimeout(() => {
      searchShows(term, 1)
        .then((result) => {
          if (current) setSuggestions(result.results.slice(0, 6));
        })
        .catch(() => {
          if (current) setSuggestions([]);
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }, 300);

    return () => {
      current = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    if (!loading) { setSearchSeconds(0); return; }
    const timer = window.setInterval(() => setSearchSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  function choose(show: TVShow) {
    setOpen(false);
    setActiveIndex(-1);
    onQueryChange(show.name);
    onSelect(show);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        choose(suggestions[activeIndex]);
      } else if (query.trim()) {
        setOpen(false);
        onSearch(query.trim());
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showList = open && query.trim().length >= 2;

  return (
    <div className={`show-autocomplete ${className}`}>
      <input
        type="search"
        className={inputClassName}
        value={query}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <div className="show-suggestions" id={listId} role="listbox" aria-label="Matching TV shows">
          {loading ? (
            <p className="suggestion-status">Searching shows… · {searchSeconds}s elapsed</p>
          ) : suggestions.length ? suggestions.map((show, index) => (
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              id={`${listId}-option-${index}`}
              className={`show-suggestion ${index === activeIndex ? 'active' : ''}`}
              key={show.id}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(show)}
            >
              <img src={getPosterUrl(show.poster_path)} alt="" />
              <span>{show.name}</span>
            </button>
          )) : (
            <p className="suggestion-status">No matching shows found.</p>
          )}
        </div>
      )}
    </div>
  );
}
