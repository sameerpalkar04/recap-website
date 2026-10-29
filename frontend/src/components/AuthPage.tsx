import { Link, useSearchParams } from 'react-router-dom';
import '../styles.css';

interface Props { mode: 'login' | 'signup' }

export default function AuthPage({ mode }: Props) {
  const [params] = useSearchParams();
  const isSignup = mode === 'signup';
  const error = params.get('error');

  return (
    <section className="auth-page">
      <div className="auth-card">
        <Link className="auth-brand" to="/">Afterword <span>/ THE RECAP JOURNAL</span></Link>
        <p className="auth-kicker">A little more context</p>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-description">
          {isSignup ? 'Save your place and keep your recaps close.' : 'Sign in to return to your recap journal.'}
        </p>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <a className="google-auth-button" href={`/api/auth/google?flow=${mode}&next=${encodeURIComponent(params.get('next') || '')}`}>
          <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.87c-.58 2.96-2.26 5.48-4.74 7.18l7.65 5.94c4.47-4.13 7.2-10.2 7.2-17.59Z"/><path fill="#FBBC05" d="M10.54 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.2a23.96 23.96 0 0 0 0 21.58l7.98-6.2Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.65-5.94c-2.13 1.43-4.85 2.27-8.25 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.2C6.51 42.63 14.62 48 24 48Z"/></svg>
          {isSignup ? 'Sign up with Google' : 'Continue with Google'}
        </a>
        <p className="auth-terms">By continuing, you agree to use Afterword with your Google account.</p>
        <div className="auth-guest-option"><span>or</span><Link to="/shows">Continue as a guest</Link><small>Browse shows and generate recaps without saving them.</small></div>
        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New to Afterword?'}{' '}
          <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link>
        </p>
      </div>
    </section>
  );
}
