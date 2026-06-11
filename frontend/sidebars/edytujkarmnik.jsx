import React, { useState, useEffect, useRef } from 'react';

export function SidebarEdytuj({ feeder, onSave, onDelete, onDeleteImage, onCancel, currentUser, pointRequest }) {
  const [localCoords, setLocalCoords] = useState([feeder.lat, feeder.lng]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedFilesCount, setSelectedFilesCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGalleryManager, setShowGalleryManager] = useState(false);
  const [originalVideoLink] = useState(feeder.videoLink || null); // Przechowaj oryginalny link
  const [formData, setFormData] = useState({
    nazwa: feeder.nazwa,
    opis: feeder.opis || '',
    link: feeder.videoLink || '',
  });
  const fileInputRef = useRef(null);

  const changeMode = () => {
    setIsSelecting(true);
    
    pointRequest((lat, lng) => {
      setLocalCoords([lat, lng]); 
      setIsSelecting(false);
    });
  };

  const handleCoordSelect = (lat, lng) => {
    setLocalCoords([lat, lng]);
    setIsSelecting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Jeśli link nie został zmieniony, użyj oryginalnej wartości
    const linkToSend = formData.link !== '' ? formData.link : originalVideoLink || '';
    
    onSave({
      id: feeder.id,
      nazwa: formData.nazwa,
      opis: formData.opis,
      link: linkToSend,
      files: fileInputRef.current?.files || new FileList(),
    }, localCoords[0], localCoords[1]);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(feeder.id);
  };

  return (
    <form onSubmit={handleSubmit} className="sidebar-pane auth-form add-object-form">
      <h2>Edytuj obiekt</h2>
      
      <div className="location-section">
        <button 
          type="button" 
          onClick={changeMode}
          className={`btn-select ${isSelecting ? 'selecting' : ''} ${!isSelecting ? 'selected' : ''}`}
        >
          {isSelecting 
            ? "Wybierz nowy punkt na mapie" 
            : "Zmień punkt"
          }
        </button>

        {localCoords && (
          <div className="location-info">
            Lokalizacja: {localCoords[0].toFixed(4)}, {localCoords[1].toFixed(4)}
          </div>
        )}
      </div>

      <label>
        Nazwa obiektu
        <input 
          type="text" 
          name="nazwa" 
          value={formData.nazwa}
          onChange={handleInputChange}
          placeholder="Nazwa obiektu" 
          required 
        />
      </label>
      <label>
        Opis
        <input 
          type="text" 
          name="opis" 
          value={formData.opis}
          onChange={handleInputChange}
          placeholder="Opis" 
          required 
        />
      </label>
      <div className="input-group">
        <span className="input-label">Dodaj nowe zdjęcia</span>
        <div className="file-input-group">
          <input
            ref={fileInputRef}
            type="file"
            name="atrybut2"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => setSelectedFilesCount(e.target.files.length)}
          />
          <button
            type="button"
            className={`btn-select file-select-button ${selectedFilesCount > 0 ? 'has-files' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFilesCount > 0
              ? `Wybrano ${selectedFilesCount} plików`
              : 'Wybierz pliki'}
          </button>
        </div>
      </div>
      <label>
        Link do transmisji na żywo
        <input 
          type="text" 
          name="link" 
          value={formData.link}
          onChange={handleInputChange}
          placeholder="Link do transmisji na żywo" 
        />
      </label>

      {feeder.allImages && feeder.allImages.length > 0 && (
        <button 
          type="button" 
          className="btn-manage-gallery"
          onClick={() => setShowGalleryManager(!showGalleryManager)}
        >
          📷 Zarządzaj galerią ({feeder.allImages.length})
        </button>
      )}
      
      <div className="sidebar-bottom-actions">
        <button type="submit" className="btn-submit">
          Zapisz zmiany
        </button>
      </div>

      {currentUser && currentUser.id === feeder.userId && (
        <button 
          type="button" 
          className="btn-delete"
          onClick={handleDeleteClick}
        >
          Usuń obiekt
        </button>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="delete-confirm-box">
            <p>Czy na pewno chcesz usunąć ten obiekt? Tej operacji nie można cofnąć.</p>
            <div className="delete-confirm-actions">
              <button 
                type="button" 
                className="btn-confirm-delete"
                onClick={handleConfirmDelete}
              >
                Usuń
              </button>
              <button 
                type="button" 
                className="btn-cancel-delete"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {showGalleryManager && feeder.allImages && (
        <div className="gallery-manager-modal">
          <div className="gallery-manager-box">
            <div className="gallery-manager-header">
              <h3>Zarządzaj galerią</h3>
              <button 
                type="button" 
                className="gallery-manager-close"
                onClick={() => setShowGalleryManager(false)}
              >
                ×
              </button>
            </div>
            <div className="gallery-grid-manager">
              {feeder.allImages.map((img) => (
                <div key={img.id} className="gallery-item-manager">
                  <img src={img.image_url} alt="Zdjęcie" />
                  <div className="gallery-item-actions">
                    <button 
                      type="button" 
                      className="btn-delete-image"
                      onClick={() => onDeleteImage(img.id)}
                      title="Usuń zdjęcie"
                    >
                      ✕
                    </button>
                    {feeder.allImages[0]?.id === img.id && (
                      <span className="badge-thumbnail">Miniaturka</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
