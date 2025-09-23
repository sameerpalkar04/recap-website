import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ShowPage from './components/ShowPage';
import ShowRow from './components/ShowRow';
import Slideshow from './components/Slideshow';
import Footer from './components/Footer'; // import Footer
import type { TVShow } from './api/tmdb';
import { fetchPopularShows } from './api/tmdb';
import './styles.css';

function MainContent() {
  const location = useLocation();
  const [shows, setShows] = useState<TVShow[]>([]);

  useEffect(() => {
    async function loadShows() {
      const popularShows = await fetchPopularShows();
      setShows(popularShows);
    }
    loadShows();
  }, []);

  return (
    <main>
      {location.pathname === '/' && <Slideshow />}

      <div className="show-row-wrapper">
        <Routes>
          <Route
            path="/"
            element={<ShowRow title="Popular Shows" shows={shows} />}
          />
          <Route path="/show/:showName" element={<ShowPage />} />
        </Routes>
      </div>

      {/* Footer component */}
      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <MainContent />
    </BrowserRouter>
  );
}
