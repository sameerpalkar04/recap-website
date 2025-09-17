import React, { useState } from "react";

interface Props {
  onGenerate: (show: string, season: number, episode: number) => void;
}

export default function ShowSelector({ onGenerate }: Props) {
  const [show, setShow] = useState('');
  const [season, setSeason] = useState<number | ''>(1); // default season 1
  const [episode, setEpisode] = useState<number | ''>('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (show && season && episode) onGenerate(show, Number(season), Number(episode));
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}
    >
      <input
        placeholder="Enter Show Name"
        value={show}
        onChange={(e) => setShow(e.target.value)}
        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
      />

      <input
        type="number"
        placeholder="Enter Season Number"
        value={season}
        onChange={(e) => setSeason(e.target.value ? Number(e.target.value) : '')}
        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        min={1}
      />

      <input
        type="number"
        placeholder="Enter Episode Number"
        value={episode}
        onChange={(e) => setEpisode(e.target.value ? Number(e.target.value) : '')}
        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        min={1}
      />

      <button
        type="submit"
        style={{
          backgroundColor: '#007BFF',
          color: '#fff',
          padding: '0.5rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Generate Recap
      </button>
    </form>
  );
}
