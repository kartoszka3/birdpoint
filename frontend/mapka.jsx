import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

//MOCKUP DANE
const mockKarmniki = [
  { id: 1, nazwa: "Karmnik przy Politechnice", lat: 52.222, lng: 21.007, opis: "Dużo wróbli!" },
  { id: 2, nazwa: "Karmnik Pole Mokotowskie", lat: 52.215, lng: 20.995, opis: "Widziane sikorki bogatki." },
  { id: 3, nazwa: "Karmnik Park Saski", lat: 52.241, lng: 21.011, opis: "Głównie gołębie i kawki." }
];

const iconSrcs = ['/icon1.png', '/icon2.png', '/icon3.png', '/icon4.png']
const sidebarContents = [
  { title: 'Sidebar 1', text: 'To jest zawartość sidebaru dla pierwszej ikony.' },
  { title: 'Sidebar 2', text: 'To jest zawartość sidebaru dla drugiej ikony.' },
  { title: 'Sidebar 3', text: 'To jest zawartość sidebaru dla trzeciej ikony.' },
  { title: 'Sidebar 4', text: 'To jest zawartość sidebaru dla czwartej ikony.' },
]

export default function Mapka() {
  const [activeSidebar, setActiveSidebar] = useState(null)

  return (
    <div className="app-shell">
      <div className="icon-panel">
        {iconSrcs.map((src, index) => (
          <button
            key={index}
            type="button"
            className="icon-circle"
            onClick={() => setActiveSidebar(index)}
            aria-label={`Otwórz sidebar ${index + 1}`}
          >
            <img src={src} alt={`Ikona ${index + 1}`} />
          </button>
        ))}
      </div>

      <aside className={`sidebar ${activeSidebar !== null ? 'sidebar-open' : ''}`}>
        <button type="button" className="sidebar-close" onClick={() => setActiveSidebar(null)}>
          ×
        </button>
        {activeSidebar !== null ? (
          <>
            <h2>{sidebarContents[activeSidebar].title}</h2>
            <p>{sidebarContents[activeSidebar].text}</p>
          </>
        ) : (
          <p>Kliknij ikonę, aby otworzyć sidebar.</p>
        )}
      </aside>

      <div className="map-container">
        <MapContainer center={[52.22970000, 21.01220000]} zoom={13} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[52.22970000, 21.01220000]}>
            <Popup>
              A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  )
}