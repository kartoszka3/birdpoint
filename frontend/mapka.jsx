import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Circle, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import MapClickHandler from './roznosci'

import { SidebarBazaWiedzy } from './sidebars/bazawiedzy'
import { SidebarDodaj } from './sidebars/dodajkarmnik'
import { SidebarEdytuj } from './sidebars/edytujkarmnik'
import { SidebarSilnikRekomendacji } from './sidebars/silnik'
import { SidebarWyszukajUzytkownika, SidebarProfil } from './sidebars/uzytkownicy'
import { SidebarAuth } from './sidebars/logowanie'

import { iconSrcs, markerIcon } from './content'
import { useMapkaState } from './mapka_state' // Upewnij się, że ścieżka do hooka jest poprawna

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
    editingFeeder,
    notification,
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
    openEditFeeder,
    handleLogin,
    handleRegister,
    handleLogout,
    handleMapClick,
    readNewFeeder,
    readEditFeeder,
    readDeleteFeeder,
    handleDeleteImage,
    setSelectedUser,
    setOnLocationSelectedAction,
    handleAvatarUpdated,
    BazaWiedzyLinki,
      
    // Dane algorytmu ze stanu aplikacji
    recommendationData,
    setRecommendationData,
    recommendationCoords,
    setRecommendationCoords,
    bufferSize,
    setBufferSize         // Promień wpisany przez użytkownika (w metrach)
  } = useMapkaState()

  // Konwersja promienia na liczbę (jeśli puste lub niepoprawne, domyślnie dajemy np. 100m)
  const currentRadius = bufferSize ? parseInt(bufferSize, 10) : 100;
  console.log("LOG 3 [Mapka.jsx]: Aktualny stan renderowania okręgu -> Coords:", recommendationCoords, "Radius:", currentRadius);

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

            // CZYSZCZENIE WARSTW: Jeśli kliknięto ikonę inną niż silnik rekomendacji (indeks 2)
            if (index !== 2) {
              setRecommendationData(null);
              setRecommendationCoords(null);
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

          // CZYSZCZENIE WARSTW przy przejściu do profilu/logowania
          setRecommendationData(null);
          setRecommendationCoords(null);
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

          // CZYSZCZENIE WARSTW przy zamknięciu panelu bocznego krzyżykiem
          setRecommendationData(null);
          setRecommendationCoords(null);
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
            {activeSidebar === 'edit' && editingFeeder && (
              <SidebarEdytuj
                feeder={editingFeeder}
                currentUser={currentUser}
                pointRequest={(callback) => setOnLocationSelectedAction(() => callback)}
                onSave={readEditFeeder}
                onDelete={readDeleteFeeder}
                onDeleteImage={handleDeleteImage}
                onCancel={() => {
                  setActiveSidebar(null);
                  setOnLocationSelectedAction(null);
                }}
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
                setRecommendationData={setRecommendationData}
                recommendationCoords={recommendationCoords}
                setRecommendationCoords={setRecommendationCoords}
                bufferSize={bufferSize}
                setBufferSize={setBufferSize}
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

            {/* RYSOWANIE SAMEGO BUFORA WOKÓŁ KLIKNIĘTEGO PUNKTU */}
            {recommendationCoords && 
              Array.isArray(recommendationCoords) && 
              recommendationCoords[0] && 
              recommendationCoords[1] && (
                <>
                  {/* Wyraźny, ale bardzo estetyczny, delikatny okrąg analizy */}
                  <Circle
                    key={`buffer-${recommendationCoords[0]}-${recommendationCoords[1]}-${currentRadius}`}
                    center={[recommendationCoords[0], recommendationCoords[1]]}
                    radius={currentRadius > 0 ? currentRadius : 100}
                    pathOptions={{
                      color: '#2ecc71',      // Spójny, zielony kolor obrysu
                      fillColor: '#2ecc71',
                      fillOpacity: 0.05,     // Bardzo delikatne przezroczyste tło (5%)
                      weight: 1.5,           // Cieniutka krawędź obrysu
                      dashArray: '4, 4'      // Gęstsza przerywana linia
                    }}
                  />

                  {/* Malutka pinezka w samym centrum kliknięcia */}
                  <CircleMarker 
                    center={recommendationCoords} 
                    radius={2} 
                    pathOptions={{ color: '#e74c3c', fillColor: '#e74c3c', fillOpacity: 1 }} 
                  />
                </>
              )}

            {/* RENDEROWANIE TYLKO PRZYDATNYCH (ZIELONYCH) POLIGONÓW */}
            {recommendationData && (
              <GeoJSON 
                key={JSON.stringify(recommendationData)} 
                data={recommendationData} 
                filter={(feature) => {
                  return feature.properties && feature.properties.score > 0.3;
                }}
                style={() => {
                  return {
                    fillColor: '#2ecc71',
                    weight: 1,
                    color: '#2ecc71',
                    fillOpacity: 0.35
                  };
                }}
                onEachFeature={(feature, layer) => {
                  const props = feature.properties;
                  layer.bindPopup(`
                    <div style="font-family: sans-serif; font-size: 13px; line-height: 1.5; padding: 4px;">
                      Odległość do zieleni: <strong>${props.green_distance_m} m</strong><br/>
                      Odległość do dróg: <strong>${props.road_distance_m} m</strong><br/>
                      Najbliższy karmnik: <strong>${props.feeder_distance_m} m</strong>
                    </div>
                  `);
                }}
              />
            )}

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
                        {currentUser && currentUser.id === k.userId && (
                          <button type="button" className="popup-icon-button" onClick={() => openEditFeeder(k)} title="Edytuj">
                            ✎
                          </button>
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

        {notification && (
          <div className="notification bottom-left">
            {notification}
          </div>
        )}
      </div>
    </div>
  )
}