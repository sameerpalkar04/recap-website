import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import ShowSelector from './ShowSelector';
import { fetchShowByName, getPosterUrl } from '../api/tmdb';
import type { TVShow } from '../api/tmdb';
import SeasonRecap from './SeasonRecap';
import '../styles.css';

export default function ShowPage() {
  const { showName } = useParams<{ showName: string }>();
  const [recap, setRecap] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [recapScope, setRecapScope] = useState<{ season: number; episode: number } | null>(null);
  const [requestedEpisode, setRequestedEpisode] = useState<{ season: number; episode: number } | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState<string>('');
  const [showDetailsLoading, setShowDetailsLoading] = useState(false);
  const [detailsElapsed, setDetailsElapsed] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recapPersisted, setRecapPersisted] = useState<boolean | null>(null);


  useEffect(() => {
    async function loadShowData() {
      if (!showName) return;
      setShowDetailsLoading(true);
      try {
        const name = showName.replace(/-/g, ' ');
        const show: TVShow | null = await fetchShowByName(name);
        if (show) {
          setPosterUrl(getPosterUrl(show.poster_path));
          setShowOverview(show.overview);
        } else {
          setPosterUrl('/placeholder.png');
          setShowOverview('');
        }
      } catch {
        setPosterUrl('/placeholder.png');
        setShowOverview('');
      } finally {
        setShowDetailsLoading(false);
      }
    }
    loadShowData();
  }, [showName]);

  useEffect(() => {
    if (!showDetailsLoading) { setDetailsElapsed(0); return; }
    const timer = window.setInterval(() => setDetailsElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [showDetailsLoading]);

  useEffect(() => {
    if (!loading) { setElapsedSeconds(0); return; }
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [loading]);


  async function handleGenerate(show: string, season: number, episode: number) {
    try {
      setLoading(true);
      setRequestedEpisode({ season, episode });
      setRequestError('');
      const res = await fetch('/api/recaps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show: showName || show,
          season_no: season,
          episode_no: episode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate recap');
      setRecap(data.summary);
      setRecapScope({ season, episode });
      setRecapPersisted(Boolean(data.persisted));
    } catch (err) {
      console.error('Error fetching recap:', err);
      setRequestError(err instanceof Error ? err.message : 'Could not generate recap');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="show-page-container">
        <div className="show-page-content">
          {/* LEFT COLUMN - Title, Overview, Form, Recap */}
          <div className="show-selector-container">
            <h1 className="show-title">
              {showName ? showName.replace(/-/g, ' ') : 'Select a Show'}
            </h1>

            {showOverview && <p className="show-description">{showOverview}</p>}

            <ShowSelector
              onGenerate={handleGenerate}
              selectedShow={showName || ''}
              isLoading={loading}
              loadingLabel="Generating…"
            />

            {requestError && <p className="request-error" role="alert">{requestError}</p>}

            {loading && (
              <div className="loading-container recap-loading-panel fade-in">
                <p className="recap-loading-eyebrow">Your story, taking shape</p>
                <div className="story-journey" aria-hidden="true">
                  <span className="story-journey-rail"><i /></span>
                  <div className="story-journey-card">
                    <span className="story-journey-index">{requestedEpisode ? `S${requestedEpisode.season} · E${requestedEpisode.episode}` : 'EPISODE'}</span>
                    <span className="story-journey-label">Episode</span>
                  </div>
                  <div className="story-journey-card">
                    <span className="story-journey-index">01</span>
                    <span className="story-journey-label">Main plot</span>
                  </div>
                  <div className="story-journey-card story-journey-card-final">
                    <span className="story-journey-index">✳</span>
                    <span className="story-journey-label">Your recap</span>
                  </div>
                </div>
                <p className="loading-text" role="status" aria-live="polite">{elapsedSeconds < 4 ? 'Finding the episode’s story…' : elapsedSeconds < 12 ? 'Following the main plot threads…' : 'Writing your concise recap…'}</p>
                <p className="loading-detail">{elapsedSeconds < 45 ? `About ${45 - elapsedSeconds} seconds estimated · ${elapsedSeconds}s elapsed` : `${elapsedSeconds}s elapsed · taking longer than usual; still waiting on the recap provider`}</p>
              </div>
            )}

            {recap && !loading && (
              <div className="recap-container">
                <div className="recap-header">
                  <svg
                    className="recap-icon"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="recap-title">Story so far</h3>
                </div>
                {recapScope && <p className="recap-scope">Through Season {recapScope.season}, Episode {recapScope.episode}</p>}
                <div className="recap-content"><SeasonRecap text={recap} throughSeason={recapScope?.season} throughEpisode={recapScope?.episode} /></div>
                {recapPersisted ? <p className="recap-save-note">Saved to your account.</p> : <p className="recap-save-note">Guest recap · this recap will not be saved. <Link to="/signup">Create an account</Link></p>}

              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Poster */}
          <div className="show-details">
            {showDetailsLoading && <div className="async-loader show-details-loader"><span className="async-line-loader" aria-hidden="true"><i /></span><p>Loading show details… · {detailsElapsed}s elapsed</p></div>}
            {posterUrl && (
              <div className="show-poster">
                <img src={posterUrl} alt={showName || 'Show poster'} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
