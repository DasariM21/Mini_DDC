'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { createClient } from '../../lib/supabase/client';

type AuthFormProps = {
  mode: 'login' | 'signup';
  isConfigured: boolean;
  setupRequired?: boolean;
  authError?: string;
};

export function AuthForm({ mode, isConfigured, setupRequired = false, authError }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === 'signup';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfigured || isSubmitting) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`
          }
        });
        if (signupError) throw signupError;
        if (data.session) {
          router.replace('/');
          router.refresh();
        } else {
          setSuccess('Check your email for a confirmation link to finish creating your account.');
        }
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        router.replace('/');
        router.refresh();
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="wordmark" href="/">MINIDSP</Link>
        <span className="environment-label">SECURE WORKSPACE</span>
      </header>
      <section className="auth-content" aria-labelledby="auth-title">
        <p className="eyebrow">ACCOUNT ACCESS</p>
        <h1 id="auth-title">{isSignup ? 'Create your account' : 'Sign in'}</h1>
        <p className="auth-description">
          {isSignup ? 'Create an account to access your private scan workspace.' : 'Sign in to continue to your private scan workspace.'}
        </p>

        {!isConfigured && (
          <p className="auth-notice" role="status">
            Supabase is not configured. Add the project URL and public anon key to the local <code>.env.local</code> file, then restart the development server.
          </p>
        )}
        {setupRequired && isConfigured && (
          <p className="auth-notice" role="status">Your session has expired. Sign in to continue.</p>
        )}
        {authError === 'confirmation' && (
          <p className="auth-error" role="alert">The confirmation link could not be verified. Request a new signup email and try again.</p>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {success && <p className="auth-success" role="status">{success}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="lp-input lp-input--full-width">
            <div className="lp-input__row lp-input__row--label-top">
              <label className="lp-input__label" htmlFor={`${mode}-email`}>Email</label>
              <div className={`lp-input__field${error ? ' lp-input__field--error' : ''}`}>
                <input
                  className="lp-input__input"
                  id={`${mode}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? `${mode}-error` : undefined}
                />
              </div>
            </div>
          </div>
          <div className="lp-input lp-input--full-width">
            <div className="lp-input__row lp-input__row--label-top">
              <label className="lp-input__label" htmlFor={`${mode}-password`}>Password</label>
              <div className={`lp-input__field${error ? ' lp-input__field--error' : ''}`}>
                <input
                  className="lp-input__input"
                  id={`${mode}-password`}
                  name="password"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  minLength={isSignup ? 8 : undefined}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? `${mode}-error` : undefined}
                />
              </div>
            </div>
            {isSignup && <p className="lp-input__message">Use at least 8 characters.</p>}
          </div>
          {error && <p className="lp-input__message lp-input__message--error" id={`${mode}-error`}>{error}</p>}
          <button className="lp-button lp-button--primary lp-button--md" type="submit" disabled={!isConfigured || isSubmitting}>
            {isSubmitting ? 'Please wait' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New to MiniDSP?'}{' '}
          <Link href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create account'}</Link>
        </p>
      </section>
      <footer className="auth-footer">MINIDSP · TRAINING BUILD</footer>
    </main>
  );
}
