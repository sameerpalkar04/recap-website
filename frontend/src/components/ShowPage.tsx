import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import ShowSelector from './ShowSelector';
import '../styles.css';

export default function ShowPage() {
  const { showName } = useParams<{ showName: string }>();
  const [recap, setRecap] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerate(show: string, season: number, episode: number) {
    try {
      setLoading(true);
      const res = await fetch('/generate-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show: showName || show, // ✅ uses URL showName if available
          season_no: season,
          episode_no: episode,
        }),
      });

      const data = await res.json();
      setRecap(data.summary);
    } catch (err) {
      console.error('Error fetching recap:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="bg-black min-h-screen text-white pt-24 px-6">
        {/* ✅ Show title from URL */}
        <h2 className="text-3xl font-bold text-red-600 mb-6 text-center">
          {showName}
        </h2>

        {/* Pass selected show name to ShowSelector */}
        <div className="max-w-lg mx-auto bg-gray-900 p-6 rounded-xl shadow-lg">
          <ShowSelector onGenerate={handleGenerate} selectedShow={showName || ''} />
        </div>

        {/* Loading State */}
        {loading && (
          <p className="mt-4 text-center text-gray-400 animate-pulse">
            Fetching recap...
          </p>
        )}

        {/* Recap Output */}
        {recap && (
          <div className="mt-6 p-4 bg-gray-800 rounded-xl max-w-lg mx-auto">
            <h3 className="text-red-400 font-bold mb-2">Recap:</h3>
            <p className="whitespace-pre-line leading-relaxed text-gray-200">
              {recap}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
