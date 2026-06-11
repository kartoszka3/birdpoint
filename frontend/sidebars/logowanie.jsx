import React, { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api';

/////////////////////////////
///LOGOWANIE I REJESTRACJA///
/////////////////////////////

// SWIEZY SLOP DO SPRAWDZENIA JESZCZE CIEPLY
export function SidebarAuth({ users = [], currentUser, mode = 'choice', onLogin, onRegister, onLogout }) {
  const [authStep, setAuthStep] = useState(mode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!currentUser;

  useEffect(() => {
    setAuthStep(mode);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, [mode]);

  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, [authStep]);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(username, password);
      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        join_date: data.user.join_date,
        avatar: data.user.avatar || '/assets/pics/profile_pics/profilowe_default.png',
      };
      onLogin(userData);
    } catch (err) {
      setError(err.message || 'Logowanie nieudane');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // Walidacja po stronie klienta
    const trimmedName = username.trim();
    if (!trimmedName) {
      setError('Podaj nazwę użytkownika.');
      return;
    }
    if (password.length < 4) {
      setError('Hasło musi mieć co najmniej 4 znaki.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Hasło musi być takie samo.');
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser(trimmedName, email, password);
      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        join_date: data.user.join_date,
        avatar: data.user.avatar || '/assets/pics/profile_pics/profilowe_default.png',
      };
      onRegister(userData);
    } catch (err) {
      try {
        const errorData = JSON.parse(err.message);
        const errorMessages = Object.values(errorData).flat();
        setError(errorMessages[0] || 'Rejestracja nieudana');
      } catch {
        setError(err.message || 'Rejestracja nieudana');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar-pane auth-pane">
      <h2>{isLoggedIn ? `Witaj, ${currentUser.username}` : 'Zaloguj się lub zarejestruj'}</h2>

      {isLoggedIn ? (
        <>
          <p>Jesteś zalogowany jako {currentUser.username}.</p>
          <button type="button" className="btn-submit" onClick={onLogout}>
            Wyloguj się
          </button>
        </>
      ) : (
        <>
          <div className="auth-mode-buttons">
            <button
              type="button"
              className={`auth-mode ${authStep === 'login' ? 'active' : ''}`}
              onClick={() => setAuthStep('login')}
            >
              Zaloguj się
            </button>
            <button
              type="button"
              className={`auth-mode ${authStep === 'register' ? 'active' : ''}`}
              onClick={() => setAuthStep('register')}
            >
              Zarejestruj się
            </button>
          </div>

          {authStep === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <label>
                Nazwa użytkownika
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Twoja nazwa"
                  required
                  disabled={loading}
                />
              </label>
              <label>
                Hasło
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Twoje hasło"
                  required
                  disabled={loading}
                />
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Logowanie...' : 'Zaloguj się'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <label>
                Nazwa użytkownika
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Wybierz nazwę"
                  required
                  disabled={loading}
                />
              </label>
              <label>
                Email (opcjonalnie)
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Twój email"
                  disabled={loading}
                />
              </label>
              <label>
                Hasło
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Hasło"
                  required
                  disabled={loading}
                />
              </label>
              <label>
                Powtórz hasło
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Powtórz hasło"
                  required
                  disabled={loading}
                />
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Rejestracja...' : 'Zarejestruj się'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
