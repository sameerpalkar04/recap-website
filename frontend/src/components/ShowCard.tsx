import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TVShow } from '../api/tmdb';
import { getPosterUrl } from '../api/tmdb';
import '../styles.css';

interface ShowCardProps {
  show: TVShow;
  size?: 'small' | 'normal' | 'large';
}

export default function ShowCard({ show, size = 'normal' }: ShowCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const posterUrl = getPosterUrl(show.poster_path);

  return (
    <div
      className={`show-card ${size} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/show/${encodeURIComponent(show.name)}`)}
    >
      <img src={posterUrl} alt={show.name} />
      <div className="show-card-overlay">
        <div className="show-card-content">
          <div className="show-card-title">{show.name}</div>
        </div>
      </div>
    </div>
  );
}
