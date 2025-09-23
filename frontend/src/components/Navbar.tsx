import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import '../styles.css';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/show/${encodeURIComponent(query)}`);
      setShowSearch(false);
    }
  }

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
  <div className="navbar-left">
    <h1 className="navbar-brand" onClick={() => navigate('/')}>RecapFlix</h1>
    <ul className="navbar-menu">
      <li onClick={() => navigate('/')}>Home</li>
      <li>TV Shows</li>
      <li>My Recaps</li>
    </ul>
  </div>

  <div className="navbar-right">
    <form onSubmit={handleSearch}>
      <div className={`search-container ${showSearch ? 'active' : ''}`}>
        <Search className="search-icon" onClick={() => setShowSearch(!showSearch)} />
        <input
          type="text"
          placeholder="Enter Show Name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`search-input ${showSearch ? 'active' : ''}`}
        />
      </div>
    </form>
    <div className="profile-avatar" />
  </div>
</div>

    </nav>
  );
}
