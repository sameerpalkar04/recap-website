import { useRef } from 'react';
import type { TVShow } from '../api/tmdb';
import ShowCard from './ShowCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles.css';

interface ShowRowProps {
  title: string;
  shows: TVShow[];
  size?: 'small' | 'normal' | 'large';
}

export default function ShowRow({ title, shows, size = 'normal' }: ShowRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="show-grid">
      <h2 className="show-row-title">{title}</h2>
      <div className="show-row-container">
        <button className="scroll-arrow left" onClick={() => scroll('left')}>
          <ChevronLeft />
        </button>

        <div ref={containerRef} className="show-row-scroll">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} size={size} />
          ))}
        </div>

        <button className="scroll-arrow right" onClick={() => scroll('right')}>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
