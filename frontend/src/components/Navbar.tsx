import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/show/${encodeURIComponent(query)}`);
  }

  return (
    <nav className="fixed w-full z-50 flex items-center justify-between p-4 bg-black shadow-md">
      <h1
        className="text-red-600 text-3xl font-bold cursor-pointer"
        onClick={() => navigate('/')}
      >
        RecapFlix
      </h1>
      <form className="flex gap-2" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-4 py-2 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
        >
          Search
        </button>
      </form>
    </nav>
  );
}
