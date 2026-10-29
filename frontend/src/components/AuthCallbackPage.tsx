import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Checking your sign in…');
  const success = params.get('status') === 'success';

  useEffect(() => {
    if (!success) { setMessage('Sign in could not be completed. Please try again.'); return; }
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => response.json())
      .then(({ user }) => {
        if (!user) { setMessage('Your sign in could not be verified. Please try again.'); return; }
        setMessage(`You’re signed in as ${user.name}.`);
        const next = params.get('next');
        if (next?.startsWith('/') && !next.startsWith('//')) window.setTimeout(() => navigate(next, { replace: true }), 700);
      })
      .catch(() => setMessage('Your sign in could not be verified. Please try again.'));
  }, [success, navigate, params]);

  return (
    <section className="auth-page">
      <div className="auth-card auth-result">
        <p className="auth-kicker">Afterword</p>
        <h1>{success ? 'You’re all set' : 'Sign in needed'}</h1>
        {success && <span className="async-line-loader auth-callback-line" aria-hidden="true"><i /></span>}
        <p className="auth-description" role="status">{message}</p>
        <Link className="editorial-button" to="/">Continue to Afterword</Link>
      </div>
    </section>
  );
}
