import React, { useState } from 'react';
import { Play } from 'lucide-react';
import '../styles.css';

interface Props {
  onGenerate: (show: string, season: number, episode: number) => void;
  selectedShow?: string; // ✅ optional prop
}

export default function ShowSelector({ onGenerate, selectedShow }: Props) {
  const [show, setShow] = useState(selectedShow || '');
  const [season, setSeason] = useState<number | ''>(1);
  const [episode, setEpisode] = useState<number | ''>('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((selectedShow || show) && season && episode) {
      onGenerate(selectedShow || show, Number(season), Number(episode));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="show-selector-form">
      <h3 className="show-selector-title">
        Select Episode {selectedShow ? `for ${selectedShow}` : ''}
      </h3>

      {/* Show input only if no selectedShow passed */}
      {!selectedShow && (
        <input
        type="text"
        placeholder="Enter Show Name"
        value={show}
        onChange={(e) => setShow(e.target.value)}
        className="show-input show-name-input"
      />
    )}

  <input
    type="number"
    placeholder="Enter Season Number"
    value={season}
    onChange={(e) => setSeason(e.target.value ? Number(e.target.value) : '')}
    min={1}
    className="show-input"
  />

  <input
    type="number"
    placeholder="Enter Episode Number"
    value={episode}
    onChange={(e) => setEpisode(e.target.value ? Number(e.target.value) : '')}
    min={1}
    className="show-input"
  />

  <button type="submit" className="btn-generate">
    <Play />
    <span>Generate Recap</span>
  </button>
</form>

  );
}
