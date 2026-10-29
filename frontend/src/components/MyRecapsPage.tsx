import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { deleteRecap, getSavedRecaps } from '../api/recaps';
import type { SavedRecap } from '../api/recaps';
import SeasonRecap from './SeasonRecap';

export default function MyRecapsPage() {
  const [recaps, setRecaps] = useState<SavedRecap[]>([]);
  const [authStatus, setAuthStatus] = useState<'checking' | 'signed-in' | 'guest' | 'error'>('checking');
  const [pageError, setPageError] = useState('');
  const [loadingRecaps, setLoadingRecaps] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (authStatus !== 'checking' && !loadingRecaps) { setElapsedSeconds(0); return; }
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [authStatus, loadingRecaps]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => response.json())
      .then(({ user }) => {
        if (user) {
          setAuthStatus('signed-in');
          setLoadingRecaps(true);
          return getSavedRecaps().then(setRecaps).catch((error: unknown) => {
            setPageError(error instanceof Error ? error.message : 'Could not load your recap library.');
          }).finally(() => setLoadingRecaps(false));
        } else {
          setAuthStatus('guest');
        }
      })
      .catch(() => setAuthStatus('error'));
  }, []);

  if (authStatus === 'checking') {
    return <section className="recaps-page"><div className="async-loader"><span className="async-line-loader" aria-hidden="true"><i /></span><p>Checking your account… · {elapsedSeconds}s elapsed</p></div></section>;
  }
  if (authStatus === 'guest') {
    return <Navigate to="/login?next=%2Frecaps" replace />;
  }
  if (authStatus === 'error') {
    return <section className="recaps-page"><p className="request-error" role="alert">Could not verify your account. Check the connection and try again.</p><Link className="editorial-button" to="/login?next=%2Frecaps">Sign in</Link></section>;
  }
  if (loadingRecaps) {
    return <section className="recaps-page"><div className="async-loader"><span className="async-line-loader" aria-hidden="true"><i /></span><p>Loading your saved recaps… · {elapsedSeconds}s elapsed</p></div></section>;
  }
  if (pageError) {
    return <section className="recaps-page"><p className="request-error" role="alert">{pageError}</p></section>;
  }

  return (
    <section className="recaps-page">
      <p className="eyebrow">Your reading shelf</p>
      <h1 className="page-title">My Recaps</h1>
      <p className="page-intro">Generated recaps are saved in this browser so you can pick up where you left off.</p>
      {recaps.length ? (
        <div className="recap-list">
          {recaps.map((recap) => (
            <article className="saved-recap" key={recap.id}>
              <div className="saved-recap-heading">
                <div>
                  <p className="eyebrow">S{recap.seasonNo} · E{recap.episodeNo}</p>
                  <h2><Link to={`/show/${encodeURIComponent(recap.show)}`}>{recap.show}</Link></h2>
                  <time dateTime={recap.generatedAt}>{new Date(recap.generatedAt).toLocaleDateString()}</time>
                </div>
                <button className="delete-recap" type="button" aria-label={`Delete recap for ${recap.show}`} onClick={async () => { try { await deleteRecap(recap.id); setRecaps((current) => current.filter((item) => item.id !== recap.id)); } catch (error) { setPageError(error instanceof Error ? error.message : 'Could not delete recap.'); } }}>
                  <Trash2 size={17} />
                </button>
              </div>
              <details>
                <summary>Read recap</summary>
                <div className="saved-recap-copy"><SeasonRecap text={recap.summary} /></div>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-recaps">
          <span className="empty-mark">A</span>
          <h2>Your recap shelf is empty.</h2>
          <p>Generate a recap for any episode and it will be saved here in this browser.</p>
          <Link className="editorial-button" to="/shows">Browse TV shows</Link>
        </div>
      )}
    </section>
  );
}
