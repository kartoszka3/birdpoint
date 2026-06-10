import React, { useState, useEffect } from 'react';

/////////////////////////////
///LOGOWANIE I REJESTRACJA///
/////////////////////////////

// SWIEZY SLOP DO SPRAWDZENIA JESZCZE CIEPLY
export function SidebarAuth({ users = [], currentUser, mode = 'choice', onLogin, onRegister, onLogout }) {
  const [authStep, setAuthStep] = useState(mode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const isLoggedIn = !!currentUser;

  useEffect(() => {
    setAuthStep(mode);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, [mode]);

  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, [authStep]);

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user || user.password !== password) {
      setError('Nieprawidłowa nazwa użytkownika lub hasło.');
      return;
    }
    onLogin(user);
  };

  const handleRegisterSubmit = (event) => {
    event.preventDefault();
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
      setError('Hasło musi być takie same.');
      return;
    }
    if (users.some(u => u.username.toLowerCase() === trimmedName.toLowerCase())) {
      setError('Taka nazwa użytkownika już istnieje.');
      return;
    }
    onRegister({ username: trimmedName, password });
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
                />
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-submit">
                Zaloguj się
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
                />
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn-submit">
                Zarejestruj się
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
