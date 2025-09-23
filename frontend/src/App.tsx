import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ShowPage from './components/ShowPage';
import ShowRow from './components/ShowRow';
import type { TVShow } from './api/tmdb';
import { fetchPopularShows } from './api/tmdb'; // hypothetical API
import './styles.css';

export default function App() {
  const [shows, setShows] = useState<TVShow[]>([]);

  useEffect(() => {
    async function loadShows() {
      const popularShows = await fetchPopularShows();
      setShows(popularShows);
    }
    loadShows();
  }, []);

  return (
    <BrowserRouter>
  <Navbar />
  <main>
    <Routes>
      <Route path="/" element={<ShowRow title="Popular Shows" shows={shows} />} />
      <Route path="/show/:showName" element={<ShowPage />} />
    </Routes>
  </main>
</BrowserRouter>

  );
}
