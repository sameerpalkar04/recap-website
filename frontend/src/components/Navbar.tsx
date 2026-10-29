import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import ShowAutocomplete from './ShowAutocomplete';
import type { TVShow } from '../api/tmdb';
import '../styles.css';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => response.json())
      .then(({ user }) => setUserName(user?.name ?? null))
      .catch(() => setUserName(null));
  }, []);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setUserName(null);
    navigate('/');
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function showSearchResults(searchQuery: string) {
    setShowSearch(false);
    navigate(`/shows?q=${encodeURIComponent(searchQuery)}`);
  }

  function openShow(show: TVShow) {
    setQuery('');
    setShowSearch(false);
    navigate(`/show/${encodeURIComponent(show.name)}`);
  }

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
  <div className="navbar-left">
    <h1 className="navbar-brand" onClick={() => navigate('/')}>Afterword</h1>
    <ul className="navbar-menu">
      <li onClick={() => navigate('/')}>Home</li>
      <li onClick={() => navigate('/shows')}>TV Shows</li>
      <li onClick={() => navigate('/recaps')}>My Recaps</li>
    </ul>
  </div>

  <div className="navbar-right">
      <div className={`search-container ${showSearch ? 'active' : ''}`}>
        <button
          type="button"
          className="search-toggle"
          aria-label={showSearch ? 'Close show search' : 'Open show search'}
          onClick={() => {
            setShowSearch((visible) => !visible);
            if (showSearch) setQuery('');
          }}
        >
          <Search className="search-icon" />
        </button>
        <ShowAutocomplete
          query={query}
          onQueryChange={setQuery}
          onSelect={openShow}
          onSearch={showSearchResults}
          placeholder="Search shows"
          ariaLabel="Search TV shows"
          className={`navbar-autocomplete ${showSearch ? 'active' : ''}`}
          inputClassName="search-input"
        />
      </div>
    {userName ? (
      <button type="button" className="nav-account" onClick={signOut} title={`Sign out ${userName}`} aria-label={`Sign out ${userName}`}>
        <span className="profile-avatar">{userName.trim().charAt(0).toUpperCase()}</span><span className="nav-account-label">Sign out</span>
      </button>
    ) : <Link className="nav-signin" to="/login">Sign in</Link>}
  </div>
</div>

    </nav>
  );
}
