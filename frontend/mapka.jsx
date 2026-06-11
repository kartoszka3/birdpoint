import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import MapClickHandler from './roznosci'

import { SidebarBazaWiedzy } from './sidebars/bazawiedzy'
import { SidebarDodaj } from './sidebars/dodajkarmnik'
import { SidebarSilnikRekomendacji } from './sidebars/silnik'
import { SidebarWyszukajUzytkownika, SidebarProfil } from './sidebars/uzytkownicy'
import { SidebarAuth } from './sidebars/logowanie'

import { iconSrcs, markerIcon } from './content'
import { useMapkaState } from './mapka_state'

////////////////////////
//SILNIK MAPY///////////
////////////////////////

export default function Mapka() {
  const {
    activeSidebar,
    setActiveSidebar,
    users,
    currentUser,
    authMode,
    feeders,
    galleryFeeder,
    galleryFullIndex,
    onLocationSelectedAction,
    selectedUser,
    overlayPane,
    mapRef,
    markerRefs,
    defaultProfileIcon,
    getUserById,
    openFeederOnMap,
    openGallery,
    closeOverlay,
    openOverlay,
    openGalleryImage,
    closeGalleryImage,
    prevGalleryImage,
    nextGalleryImage,
    openAuthSidebar,
    handleLogin,
    handleRegister,
    handleLogout,
    handleMapClick,
    readNewFeeder,
    setSelectedUser,
    setOnLocationSelectedAction,
    handleAvatarUpdated,
    BazaWiedzyLinki,
  } = useMapkaState()

  return (
    <div className="app-shell">

    <div className="icon-panel">
      
      {iconSrcs.map((src, index) => (
        <button
          key={index}
          type="button"
          className={`icon-circle ${activeSidebar === index ? 'active' : ''}`}
          onClick={() => {
            if (index === 1 && !currentUser) {
              openAuthSidebar('login')
              setSelectedUser(null)
              setOnLocationSelectedAction(null)
              return
            }
            setActiveSidebar(index)
            setSelectedUser(null)
            setOnLocationSelectedAction(null)
          }}
        >
          <img src={src} alt={`Ikona ${index + 1}`} />
        </button>
      ))}

      <button
        type="button"
        className={`icon-circle profile-circle ${activeSidebar === 4 || activeSidebar === 'auth' ? 'active' : ''}`}
        onClick={() => {
          if (currentUser) {
            setActiveSidebar(4);
          } else {
            openAuthSidebar('login');
          }
          setSelectedUser(null);
          setOnLocationSelectedAction(null);
        }}
      >
        <img src={currentUser?.avatar || defaultProfileIcon} alt="Profil" />
      </button>
      
    </div>
     
      {!currentUser && (
        <div className="top-right-controls">
          <button type="button" onClick={() => openAuthSidebar('login')}>Zaloguj</button>
          <button type="button" onClick={() => openAuthSidebar('register')}>Zarejestruj</button>
        </div>
      )}

      <aside className={`sidebar ${activeSidebar !== null ? 'sidebar-open' : ''}`}>
        <button type="button" className="sidebar-close" onClick={() => {
          setActiveSidebar(null);
          setSelectedUser(null);
          setOnLocationSelectedAction(null);
        }}>
          ×
        </button>
        {activeSidebar !== null ? (
          <>
            {activeSidebar === 'auth' && (
              <SidebarAuth
                users={users}
                currentUser={currentUser}
                mode={authMode}
                onLogin={handleLogin}
                onRegister={handleRegister}
                onLogout={handleLogout}
              />
            )}
            {activeSidebar === 0 && <SidebarBazaWiedzy links={ BazaWiedzyLinki } />}
            

            {activeSidebar === 1 && currentUser && (
              <SidebarDodaj
                pointRequest={(callback) => setOnLocationSelectedAction(() => callback)}
                onSave={readNewFeeder}
              />
            )}
            {activeSidebar === 1 && !currentUser && (
              <SidebarAuth
                users={users}
                currentUser={currentUser}
                mode="login"
                onLogin={handleLogin}
                onRegister={handleRegister}
                onLogout={handleLogout}
              />
            )}
            

            {activeSidebar === 2 && (
              <SidebarSilnikRekomendacji 

                pointRequest={(callback) => setOnLocationSelectedAction(() => callback)}
                openOverlay={(type, data) => openOverlay(type, data)}
              />
            )}
            
            {activeSidebar === 3 && (
              selectedUser ? (
                <SidebarProfil 
                  user={selectedUser}
                  currentUser={currentUser}
                  feeders={feeders}
                  onSelectFeeder={openFeederOnMap}
                  onBack={() => setSelectedUser(null)}
                />
              ) : (
                <SidebarWyszukajUzytkownika 
                  users={users}
                  currentUser={currentUser}
                  onUserSelect={(user) => setSelectedUser(user)}
                />
              )
            )}

            {activeSidebar === 4 && currentUser && (
                <SidebarProfil 
                  user={currentUser}
                  currentUser={currentUser}
                  feeders={feeders}
                  onSelectFeeder={openFeederOnMap}
                  onLogout={handleLogout}
                  onAvatarUpdated={handleAvatarUpdated}
                />
            )}
            {activeSidebar === 4 && !currentUser && (
              <SidebarAuth
                users={users}
                currentUser={currentUser}
                mode="choice"
                onLogin={handleLogin}
                onRegister={handleRegister}
                onLogout={handleLogout}
              />
            )}
          </>
        ) : (
          <p>Kliknij ikonę, aby otworzyć panel boczny.</p>
        )}
      </aside>

      <div className="map-wrapper">
        <div className={`map-container ${galleryFeeder ? 'blurred' : ''}`}>
          <MapContainer whenCreated={(map) => { mapRef.current = map; }} center={[52.22970000, 21.01220000]} zoom={13} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            <MapClickHandler onMapClick={handleMapClick} isSelectingMode={!!onLocationSelectedAction} />

            {feeders.map(k => (
              <Marker
                key={k.id}
                position={[k.lat, k.lng]}
                icon={markerIcon}
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[k.id] = ref;
                  }
                }}
              >
                <Popup className="custom-popup">
                  <div className="popup-card">
                    <div className="popup-image-wrap">
                      <img src={k.image || '/assets/pics/feeders/obraz_przykl.jpg'} alt={k.nazwa} />
                      <div className="popup-image-fade" />
                    </div>
                    <div className="popup-body">
                      <h3 className="popup-title">{k.nazwa}</h3>
                       <p className="popup-address">{k.opis || k.adres}</p>
                      <div className="popup-icons">
                        <button type="button" className="popup-icon-button" onClick={() => openGallery(k)}>
                          <img src="/assets/icons/galeria_dark.png" alt="Galeria" />
                        </button>
                        {k.videoLink && (
                          <a href={k.videoLink} target="_blank" rel="noreferrer" className="popup-icon-button">
                            <img src="/assets/icons/stream.png" alt="Video" />
                          </a>
                        )}
                      </div>
                      
                      <div className="popup-author">Dodał: {getUserById(k.userId) ? (
                          <button
                            type="button"
                            className="popup-author-btn"
                            onClick={() => {
                              setSelectedUser(getUserById(k.userId));
                              setActiveSidebar(3);
                            }}
                          >
                            {getUserById(k.userId).username}
                          </button>
                        ) : (
                          k.author || 'Anonim'
                        )}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {overlayPane && overlayPane.type === 'gallery' && (
          <div className="overlay-root gallery-overlay">
            <div className="gallery-card">
              <button type="button" className="gallery-close" onClick={closeOverlay}>×</button>
              <p className="popup-address">{overlayPane.data.opis || overlayPane.data.adres}</p>
              <div className="gallery-grid">
                {overlayPane.data.galleryImages?.map((src, index) => (
                  <button
                    key={index}
                    type="button"
                    className="gallery-thumb-button"
                    onClick={() => openGalleryImage(index)}
                  >
                    <img src={src} alt={`${overlayPane.data.nazwa} ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
            {galleryFullIndex !== null && overlayPane.data.galleryImages && (
              <div className="gallery-fullscreen">
                <button type="button" className="gallery-full-close" onClick={closeGalleryImage} aria-label="Zamknij">×</button>
                <button type="button" className="gallery-full-nav gallery-full-prev" onClick={prevGalleryImage} aria-label="Poprzednie zdjęcie">◀</button>
                <img
                  src={overlayPane.data.galleryImages[galleryFullIndex]}
                  alt={`${overlayPane.data.nazwa} ${galleryFullIndex + 1}`}
                />
                <button type="button" className="gallery-full-nav gallery-full-next" onClick={nextGalleryImage} aria-label="Następne zdjęcie">▶</button>
                <div className="gallery-full-counter">
                  {galleryFullIndex + 1} / {overlayPane.data.galleryImages.length}
                </div>
              </div>
            )}
          </div>
        )}

        {overlayPane && overlayPane.type === 'instruction' && (
          <div className="overlay-root instruction-overlay">
            <div className="overlay-card" style={{ width: 'min(720px, 100%)', height: 'min(480px, 70vh)', borderRadius: 24 }}>
              <button type="button" className="gallery-close" onClick={closeOverlay}>×</button>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}