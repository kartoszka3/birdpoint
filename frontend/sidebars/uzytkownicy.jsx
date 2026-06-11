import React, { useState, useEffect } from 'react';
import { searchUsers } from '../api';

//////////////////////////////
//WYSZUKIEWANIE UŻYTKOWNIKÓW//
//////////////////////////////

export function SidebarWyszukajUzytkownika({ users = [], currentUser, onUserSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState(users || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const doSearch = async () => {
      setLoading(true);
      try {
        const res = await searchUsers(searchQuery);
        if (!mounted) return;
        setResults(res || []);
      } catch (err) {
        console.error('Błąd wyszukiwania użytkowników', err);
        if (mounted) setResults([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Jeśli puste zapytanie, pokaż początkową listę
    if (!searchQuery) {
      setResults(users || []);
    } else {
      doSearch();
    }

    return () => { mounted = false };
  }, [searchQuery]);

  const filteredUsers = results.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sidebar-pane user-search">
      <h2>Wyszukaj użytkownika</h2>

      <div className="search-input-wrapper">
        <input 
          type="text" 
          className="search-input"
          placeholder="Wpisz nazwę użytkownika..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="labels-container">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <button 
              key={user.id} 
              className={`kb-label user-item ${currentUser && user.id === currentUser.id ? 'current-user' : ''}`}
              onClick={() => onUserSelect(user)}
            >
              <img 
                src={user.avatar} 
                alt={user.username}
              />
              <span>{user.username} {currentUser && user.id === currentUser.id && '(Ty)'}</span>
            </button>
          ))
        ) : (
          <p className="no-results">Nie znaleziono użytkownika.</p>
        )}
      </div>
    </div>
  );
}

//////////////////////////////
//PROFIL UŻYTKOWNIKA//////////
//////////////////////////////

export function SidebarProfil({ user, currentUser, feeders = [], onSelectFeeder, onBack, onLogout, onAvatarUpdated }) {
  const isCurrentUser = !!currentUser && user.id === currentUser.id;
  const userFeeders = feeders.filter((feeder) => feeder.userId === user.id);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef(null);

  const handleAvatarClick = () => {
    if (isCurrentUser && fileRef.current) {
      fileRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadAvatar } = await import('../api');
      const updated = await uploadAvatar(file);
      if (onAvatarUpdated) onAvatarUpdated(updated);
    } catch (err) {
      console.error('Upload avatar failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="sidebar-pane user-profile">
      {onBack && (
        <button 
          type="button" 
          onClick={onBack}
          className="profile-back-button"
        >
          ← Wróć
        </button>
      )}

      <div className="profile-container">
        <div className="profile-avatar-wrapper" onClick={handleAvatarClick} style={{cursor: isCurrentUser ? 'pointer' : 'default'}}>
          <img 
            src={user.avatar || '/assets/pics/profile_pics/profilowe_default.png'} 
            alt={user.username}
            className="profile-avatar"
          />
          {isCurrentUser && (
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
          )}
          {uploading && <div className="uploading-indicator">Uploading...</div>}
        </div>
        <h2>
          {user.username} {isCurrentUser && '(Ty)'}
        </h2>
      </div>

      <div className="profile-feeders">
        <h3>Karmniki użytkownika</h3>
        {userFeeders.length > 0 ? (
          userFeeders.map((feeder) => (
            <button
              key={feeder.id}
              type="button"
              onClick={() => onSelectFeeder && onSelectFeeder(feeder)}
              className="feeder-item"
            >
              <img
                src={feeder.image || '/assets/icons/karmik_pom.png'}
                alt={feeder.nazwa}
                className="feeder-image"
              />
              <div className="feeder-content">
                <div className="feeder-address">{feeder.adres || feeder.opis}</div>
              </div>
            </button>
          ))
        ) : (
          <p className="empty-message">Brak karmników przypisanych do tego użytkownika.</p>
        )}
      </div>

      {isCurrentUser && onLogout && (
        <button
          type="button"
          className="profile-logout-button"
          onClick={onLogout}
        >
          Wyloguj się
        </button>
      )}
    </div>
  );
}

