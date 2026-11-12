import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import './AuthPages.css';

export default function RegisterPage() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!fullName.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await signUp({
      email: email.trim(),
      password,
      fullName,
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data?.session) {
      navigate('/dashboard', { replace: true });
      return;
    }

    setInfoMessage(
      'Account created! Please check your email to confirm your address, then log in.'
    );
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-heading">
        <div className="auth-brand">
          <span className="auth-brand-icon" aria-hidden="true">
            T
          </span>
          <span className="auth-brand-name">TaskFlow</span>
        </div>
        <h1 id="register-heading" className="auth-subtitle">
          Create your account to start organizing tasks
        </h1>

        {!isSupabaseConfigured && (
          <div className="alert alert-warning" role="alert">
            Supabase is not configured yet. Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>.
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="alert alert-success" role="status">
            {infoMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              className="input"
              type="text"
              placeholder="Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
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
            <label className="form-label" htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              className="input"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-confirm">
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              className="input"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
