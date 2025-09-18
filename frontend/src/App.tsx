import React, { useState } from "react";
import ShowSelector from "./components/ShowSelector";

export default function App() {
  const [recap, setRecap] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleGenerate(show: string, season: number, episode: number) {
    try {
      setLoading(true);
      const res = await fetch('/generate-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show, season_no: season, episode_no: episode }),
      });

      const data = await res.json();
      setRecap(data.summary);
    } catch (error) {
      console.error('Error fetching recap:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Show Recap Generator</h1>
      <ShowSelector onGenerate={handleGenerate} />
      {loading && <p>Generating recap...</p>}
      {recap && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>Recap:</h2>
          <p
            style={{
              whiteSpace: 'pre-line', // <-- This makes \n render as new lines
              lineHeight: '1.5',
            }}
          >
            {recap}
          </p>
        </div>
      )}
    </div>
  );
}
