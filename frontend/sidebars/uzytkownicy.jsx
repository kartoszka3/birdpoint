import React, { useState, useEffect } from 'react';

//////////////////////////////
//WYSZUKIEWANIE UŻYTKOWNIKÓW//
//////////////////////////////

export function SidebarWyszukajUzytkownika({ users = [], currentUser, onUserSelect }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user => 
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

export function SidebarProfil({ user, currentUser, feeders = [], onSelectFeeder, onBack, onLogout }) {
  const isCurrentUser = !!currentUser && user.id === currentUser.id;
  const userFeeders = feeders.filter((feeder) => feeder.userId === user.id);

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
        <img 
          src={user.avatar} 
          alt={user.username}
          className="profile-avatar"
        />
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

