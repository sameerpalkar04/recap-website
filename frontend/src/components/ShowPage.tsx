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
          show: showName || show,
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
      <div className="show-page-container">
        {/* Enhanced Show Title */}
        <h1 className="show-title">
          {showName ? showName.replace(/-/g, ' ') : 'Select a Show'}
        </h1>
        <p className="show-subtitle">
          Select Episode for {showName ? showName.replace(/-/g, ' ') : 'Your Show'}
        </p>

        {/* Enhanced Show Selector */}
        <div className="show-selector-container slide-up">
          <ShowSelector 
            onGenerate={handleGenerate} 
            selectedShow={showName || ''} 
          />
        </div>

        {/* Enhanced Loading State */}
        {loading && (
          <div className="loading-container fade-in">
            <div className="loading-spinner"></div>
            <p className="loading-text">
              Generating your recap...
            </p>
          </div>
        )}

        {/* Enhanced Recap Output */}
        {recap && !loading && (
          <div className="recap-container">
            <div className="recap-header">
              <svg className="recap-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h3 className="recap-title">Episode Recap</h3>
            </div>
            <div className="recap-content">
              {recap}
            </div>
          </div>
        )}
      </div>
    </>
  );
}