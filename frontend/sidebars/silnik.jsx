import React, { useState } from 'react';

export function SidebarSilnikRekomendacji({ 
  pointRequest, 
  setRecommendationData,
  recommendationCoords,      
  setRecommendationCoords,   
  bufferSize,                
  setBufferSize              
}) {

  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectLocation = () => {
    setIsSelecting(true);
    pointRequest((lat, lng) => {
      console.log("LOG 2 [silnik.js]: Callback odebrał współrzędne z mapy:", lat, lng);
      setRecommendationCoords([lat, lng]);
      setIsSelecting(false);
    });
  };

  const handleRunAlgorithm = async () => {
    if (!bufferSize || bufferSize <= 0) {
      alert("Proszę podać prawidłowy rozmiar bufora.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/map/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: recommendationCoords ? recommendationCoords[0] : null,
          lng: recommendationCoords ? recommendationCoords[1] : null,
          buffer_m: parseInt(bufferSize, 10),
          threshold: 0.05 // stały próg na sztywno, bez suwaka
        })
      });

      if (!response.ok) throw new Error("Błąd serwera");
      
      const geoJsonData = await response.json();
      setRecommendationData(geoJsonData);

    } catch (error) {
      console.error("DEBUG SILNIKA:", error);
      alert(`Błąd analizy! Powód: ${error.message}. Sprawdź w konsoli przeglądarki (F12 -> Console) dokładne zapytanie.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sidebar-pane">
      <h2>Wyszukaj lokalizację</h2>

      <div className="location-section">
        <button 
          type="button" 
          onClick={handleSelectLocation}
          className={`btn-select ${isSelecting ? 'selecting' : ''} ${recommendationCoords && !isSelecting ? 'selected' : ''}`}
          disabled={isLoading}
        >
          {isSelecting ? "Kliknij na mapie..." : "Wybierz punkt na mapie"}
        </button>
      </div>

      <div className="input-group">
        <label className="input-label">Rozmiar bufora (metry):</label>
        <input 
          type="number" 
          min="1"
          disabled={isLoading}
          value={bufferSize} 
          onChange={(e) => setBufferSize(e.target.value.replace(/\D/g, ''))}
          className="sidebar-input"
        />
      </div>

      <div className="sidebar-bottom-actions">
        <button 
          type="button" 
          onClick={handleRunAlgorithm}
          className="btn-submit btn-success" 
          disabled={!recommendationCoords || isLoading}
        >
          {isLoading ? "Obliczanie..." : "Uruchom analizę"}
        </button>
      </div>
    </div>
  );
}