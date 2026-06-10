import React, { useState , useEffect} from 'react';

////////////////////////
//SILNIK REKOMENDACJI///
////////////////////////

export function SidebarSilnikRekomendacji({pointRequest, openOverlay}) {
  const [recommendationCoords, setRecommendationCoords] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [bufferSize, setBufferSize] = useState(10);

  const handleSelectLocation = () => {
    setIsSelecting(true);
    
    pointRequest((lat, lng) => {
      setRecommendationCoords([lat, lng]);
      setIsSelecting(false);
    });
  };

  const handleRunAlgorithm = () => {

    if (!bufferSize || bufferSize <= 0) {
      alert("Proszę podać prawidłowy rozmiar bufora (większy od 0).");
      return;
    }
    
    //TUTAJ ALGORYTM TRZA PODPIAC
    alert(`Uruchamiam algorytm rekomendacji dla punktu: ${recommendationCoords[0].toFixed(4)}, ${recommendationCoords[1].toFixed(4)}`);
    };

  return (

    <div className="sidebar-pane">
      <h2>Wyszukaj nową lokalizację</h2>

      <div className="location-section">

        
        <button 
          type="button" 
          onClick={handleSelectLocation}
          className={`btn-select ${isSelecting ? 'selecting' : ''} ${recommendationCoords && !isSelecting ? 'selected' : ''}`}
        >
          {isSelecting 
            ? "Wybierz punkt na mapie" 
            : recommendationCoords 
              ? "Zmień punkt" 
              : "Wybierz punkt na mapie"
          }
        </button>
      
      {recommendationCoords && (
          <div className="location-info">
            Wybrana lokalizacja: {recommendationCoords[0].toFixed(4)}, {recommendationCoords[1].toFixed(4)}
          </div>
        )}
      </div>
      <div className="input-group">
        <label className="input-label">
          Rozmiar bufora (metry):
        </label>
        <input 
          type="number" 
          step="1"
          min="1"
          value={bufferSize} 
          placeholder="Rozmiar bufora (m)" 
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, ''); 
            setBufferSize(val ? parseInt(val, 10) : '');
          }}
          className="sidebar-input"
        />
      </div>

      <div className="sidebar-bottom-actions">
      <button 
        type="button" 
        className="btn-submit btn-instruction" 
        onClick={() => openOverlay && openOverlay('instruction')}
      >
        Instrukcja
      </button>

      <button 
        type="button" 
        onClick={handleRunAlgorithm}
        className="btn-submit btn-success" 
        disabled={!recommendationCoords}
      >
        Uruchom analizę
      </button>
    </div>
    </div>
  );
}
