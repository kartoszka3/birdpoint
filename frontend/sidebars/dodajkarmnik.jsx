import React, { useState, useEffect, useRef } from 'react';

////////////////////////////////////
//DODAWANIE OBIEKTÓW///////////////
////////////////////////////////////

export function SidebarDodaj({ pointRequest, onSave }) {
  const [localCoords, setLocalCoords] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedFilesCount, setSelectedFilesCount] = useState(0);
  const fileInputRef = useRef(null);

  const changeMode = () => {
    setIsSelecting(true);
    
    pointRequest((lat, lng) => {
      setLocalCoords([lat, lng]); 
      setIsSelecting(false);
    });
  };

  const getFeederData = (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const files = event.target.elements.atrybut2?.files || [];

    const galleryImages = files.length > 0 
    ? Array.from(files).map((file) => URL.createObjectURL(file))
    : null;

    onSave({
      nazwa: formData.get('nazwa'),
      atrybut1: formData.get('atrybut1'),
      atrybut2: galleryImages,
      atrybut3: formData.get('atrybut3'),
    }, localCoords[0], localCoords[1]); 

    setLocalCoords(null); 
    setSelectedFilesCount(0);
  };

  return (
    <form onSubmit={getFeederData} className="sidebar-pane auth-form add-object-form">
      <h2>Dodaj nowy obiekt</h2>
      
      <div className="location-section">
        <button 
          type="button" 
          onClick={changeMode}
          className={`btn-select ${isSelecting ? 'selecting' : ''} ${localCoords && !isSelecting ? 'selected' : ''}`}
        >
          {isSelecting 
            ? "Wybierz punkt na mapie" 
            : localCoords 
              ? "Zmień punkt"
              : "Wybierz punkt na mapie"
          }
        </button>

        {localCoords && (
          <div className="location-info">
            Wybrana lokalizacja: {localCoords[0].toFixed(4)}, {localCoords[1].toFixed(4)}
          </div>
        )}
      </div>

      <label>
        Nazwa obiektu
        <input type="text" name="nazwa" placeholder="Nazwa obiektu" required />
      </label>
      <label>
        Adres
        <input type="text" name="atrybut1" placeholder="Adres" required />
      </label>
      <div className="input-group">
        <span className="input-label">Zdjęcia</span>
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
        <input type="text" name="atrybut3" placeholder="Link do transmisji na żywo" />
      </label>
      
      <div className="sidebar-bottom-actions">
        <button type="submit" className="btn-submit" disabled={!localCoords}>

          Dodaj obiekt
        </button>
      </div>
    </form>
  );
}
