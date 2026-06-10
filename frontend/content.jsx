import L from 'leaflet';

//IKONKI PASKA BOCZNEGO///
export const iconSrcs = ['/assets/icons/baza.png', '/assets/icons/dodawanie.png', '/assets/icons/silnik.png', '/assets/icons/szukaj_uzyt.png'];

//IKONA KARMNIKA//
export const markerSrc = '/assets/icons/karmik_pom.png';
export const markerIcon = L.icon({
  iconUrl: markerSrc,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

//SIDEBAR NAGLOWKI//
export const sidebarContents = [
  { title: 'Baza wiedzy', text: 'Zawartość' },
  { title: 'Dodaj karmnik', text: 'Zawartość' },
  { title: 'Silnik rekomendacji', text: 'Zawartość' },
  { title: 'Wyszukaj użytkownika', text: 'Zawartość' },
]