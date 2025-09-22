import type { TVShow } from '../api/tmdb';
import { getPosterUrl } from '../api/tmdb';
import { useNavigate } from 'react-router-dom';

interface ShowCardProps {
  show: TVShow;
}

export default function ShowCard({ show }: ShowCardProps) {
  const navigate = useNavigate();
  const posterUrl = getPosterUrl(show.poster_path);

  return (
    <div
      className="cursor-pointer transform hover:scale-105 transition overflow-hidden rounded-lg"
      onClick={() => navigate(`/show/${encodeURIComponent(show.name)}`)}
    >
      <img src={posterUrl} alt={show.name} className="w-full h-60 object-cover" />
      <p className="text-white text-center mt-2 font-medium">{show.name}</p>
    </div>
  );
}

