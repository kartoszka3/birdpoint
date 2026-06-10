import React, { useState, useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';

//////////////////////
//JAKIES FUNKCJE//////
/////////////////////

//POBRANIE WSPOLRZEDNYCH PO KLIKU
function MapClickHandler({ onMapClick, isSelectingMode }) {
  useMapEvents({
    click: (e) => {
      if (isSelectingMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default MapClickHandler;
