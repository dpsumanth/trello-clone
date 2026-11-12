import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import './AuthPages.css';

export default function LoginPage() {
  const { user, signIn, resendConfirmation } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setShowResend(false);

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      if (signInError.message.toLowerCase().includes('email not confirmed')) {
        setShowResend(true);
      }
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResending(true);
    setError('');
    setInfoMessage('');
    const { error: resendError } = await resendConfirmation(email.trim());
    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setInfoMessage('Confirmation email sent. Please check your inbox and spam folder.');
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-heading">
        <div className="auth-brand">
          <span className="auth-brand-icon" aria-hidden="true">
            T
          </span>
          <span className="auth-brand-name">TaskFlow</span>
        </div>
        <h1 id="login-heading" className="auth-subtitle">
          Log in to manage your boards and tasks
        </h1>

        {!isSupabaseConfigured && (
          <div className="alert alert-warning" role="alert">
            Supabase is not configured yet. Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>.
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            <div>{error}</div>
            {showResend && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 10 }}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend Confirmation Email'}
              </button>
            )}
          </div>
        )}

        {infoMessage && (
          <div className="alert alert-success" role="status">
            {infoMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </section>
    </main>
  );
}
