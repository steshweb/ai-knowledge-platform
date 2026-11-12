'use client';

import { useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import { apiClient } from '../lib/api-client';
import type { KnowledgeBase } from '../lib/api-client';
import { useAuth } from './auth-provider';

type AuthMode = 'login' | 'register';
type FieldErrors = {
  email?: string;
  password?: string;
};
type AuthFormState = {
  email: string;
  password: string;
  fieldErrors: FieldErrors;
  error: string;
};

export function AppShell() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  return user ? <Dashboard /> : <AuthScreen />;
}

function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [forms, setForms] = useState<Record<AuthMode, AuthFormState>>({
    login: { email: '', password: '', fieldErrors: {}, error: '' },
    register: { email: '', password: '', fieldErrors: {}, error: '' },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentForm = forms[mode];

  function updateForm(modeToUpdate: AuthMode, patch: Partial<AuthFormState>) {
    setForms((current) => ({
      ...current,
      [modeToUpdate]: { ...current[modeToUpdate], ...patch },
    }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    updateForm(mode, { error: '' });
    const nextFieldErrors: FieldErrors = {};

    if (!currentForm.email.trim()) {
      nextFieldErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentForm.email)) {
      nextFieldErrors.email = 'Enter a valid email address.';
    }

    if (currentForm.password.length < 8) {
      nextFieldErrors.password = 'Password must be at least 8 characters.';
    }

    updateForm(mode, { fieldErrors: nextFieldErrors });
    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') await login(currentForm.email, currentForm.password);
      else await register(currentForm.email, currentForm.password);
    } catch (error) {
      updateForm(mode, { error: error instanceof Error ? error.message : 'Something went wrong' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <p className="eyebrow">Private knowledge, clearly organized</p>
        <h1>Ask your documents better questions.</h1>
        <p className="muted-copy">
          Build a personal knowledge space for the documents, notes, and ideas you want to
          understand faster.
        </p>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            className={mode === 'register' ? 'tab active' : 'tab'}
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>
        <h2 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="card-subtitle">
          {mode === 'login'
            ? 'Continue to your knowledge spaces.'
            : 'Start with a private workspace.'}
        </p>

        <form className="stack-form" noValidate onSubmit={handleSubmit}>
          <label>
            Email
            <input
              aria-describedby={`${mode}-email-error`}
              aria-invalid={Boolean(currentForm.fieldErrors.email)}
              className={currentForm.fieldErrors.email ? 'input-error' : undefined}
              type="email"
              autoComplete="email"
              value={currentForm.email}
              onChange={(event) => {
                updateForm(mode, {
                  email: event.target.value,
                  fieldErrors: { ...currentForm.fieldErrors, email: undefined },
                });
              }}
              required
            />
            <span className="field-error" id={`${mode}-email-error`}>
              {currentForm.fieldErrors.email ?? ''}
            </span>
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                aria-describedby={`${mode}-password-error`}
                aria-invalid={Boolean(currentForm.fieldErrors.password)}
                className={currentForm.fieldErrors.password ? 'input-error' : undefined}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                value={currentForm.password}
                onChange={(event) => {
                  updateForm(mode, {
                    password: event.target.value,
                    fieldErrors: { ...currentForm.fieldErrors, password: undefined },
                  });
                }}
                required
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
            <span className="field-error" id={`${mode}-password-error`}>
              {currentForm.fieldErrors.password ?? ''}
            </span>
          </label>
          {currentForm.error && <p className="form-error">{currentForm.error}</p>}
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard() {
  const { user, accessToken, logout } = useAuth();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .listKnowledgeBases(accessToken)
      .then(setKnowledgeBases)
      .catch((requestError: unknown) => setError(getErrorMessage(requestError)));
  }, [accessToken]);

  async function createKnowledgeBase(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !name.trim()) return;
    setIsCreating(true);
    setError('');
    try {
      const knowledgeBase = await apiClient.createKnowledgeBase(
        accessToken,
        name.trim(),
        description.trim(),
      );
      setKnowledgeBases((current) => [knowledgeBase, ...current]);
      setName('');
      setDescription('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteKnowledgeBase(id: string) {
    if (!accessToken) return;
    try {
      await apiClient.deleteKnowledgeBase(accessToken, id);
      setKnowledgeBases((current) => current.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <main className="dashboard-layout">
      <header className="topbar">
        <div className="brand-lockup">AI Knowledge Platform</div>
        <div className="topbar-actions">
          <span className="user-email">{user?.email}</span>
          <button className="ghost-button" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Your workspace</p>
            <h1>Knowledge bases</h1>
            <p className="muted-copy">Organize the context you want your AI assistant to know.</p>
          </div>
        </div>

        <div className="dashboard-grid">
          <form className="create-card stack-form" onSubmit={createKnowledgeBase}>
            <div>
              <p className="eyebrow">New space</p>
              <h2>Create a knowledge base</h2>
            </div>
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              <span className="field-label-row">
                <span>Description</span>
                <span className="optional">(Optional)</span>
              </span>
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button" disabled={isCreating} type="submit">
              {isCreating ? 'Creating…' : 'Create knowledge base'}
            </button>
          </form>

          <section className="list-card" aria-labelledby="spaces-title">
            <div className="card-heading-row">
              <div>
                <p className="eyebrow">Private to you</p>
                <h2 id="spaces-title">Your spaces</h2>
              </div>
              <span className="count-label">{knowledgeBases.length} total</span>
            </div>
            {knowledgeBases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">+</div>
                <p>No knowledge bases yet.</p>
                <span>Create your first space to get started.</span>
              </div>
            ) : (
              <div className="knowledge-list">
                {knowledgeBases.map((knowledgeBase) => (
                  <article className="knowledge-item" key={knowledgeBase.id}>
                    <div>
                      <h3>{knowledgeBase.name}</h3>
                      <p>{knowledgeBase.description || 'No description yet.'}</p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Delete ${knowledgeBase.name}`}
                      onClick={() => void deleteKnowledgeBase(knowledgeBase.id)}
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <p>Loading your workspace…</p>
    </main>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}
