import { useState, useRef, useEffect } from 'react'
import { FakeKarmniki, FakeUzytkownicy, BazaWiedzyLinki } from './mockup_data'

export function useMapkaState() {
  const [activeSidebar, setActiveSidebar] = useState(null)
  const [users, setUsers] = useState(FakeUzytkownicy)
  const [currentUser, setCurrentUser] = useState(null)
  const [authMode, setAuthMode] = useState('choice')
  const [feeders, setFeeder] = useState(FakeKarmniki)
  const [galleryFeeder, setGalleryFeeder] = useState(null)
  const [galleryFullIndex, setGalleryFullIndex] = useState(null)
  const [onLocationSelectedAction, setOnLocationSelectedAction] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [overlayPane, setOverlayPane] = useState(null)
  const mapRef = useRef(null)
  const markerRefs = useRef({})

  const defaultProfileIcon = '/assets/pics/profile_pics/profilowe_default.png'

  const getUserById = (id) => users.find((user) => user.id === id)

  const openFeederOnMap = (feeder) => {
    if (mapRef.current) {
      mapRef.current.setView([feeder.lat, feeder.lng], 16, { animate: true })
    }
    const marker = markerRefs.current[feeder.id]
    if (marker && marker.openPopup) {
      marker.openPopup()
    }
    setActiveSidebar(null)
  }

  const openGallery = (feeder) => {
    setGalleryFeeder(feeder)
    setGalleryFullIndex(null)
    setActiveSidebar(null)
    setOverlayPane({ type: 'gallery', data: feeder })
  }

  const closeGallery = () => {
    setGalleryFeeder(null)
    setGalleryFullIndex(null)
    setOverlayPane(null)
  }

  const openOverlay = (type, data = null) => {
    setOverlayPane({ type, data })

    if (type !== 'gallery') {
      setGalleryFeeder(null)
      setGalleryFullIndex(null)
    }

    if (type !== 'instruction') {
      setActiveSidebar(null)
    }
  }

  const closeOverlay = () => {
    setOverlayPane(null)
    setGalleryFeeder(null)
    setGalleryFullIndex(null)
  }

  const openGalleryImage = (index) => {
    setGalleryFullIndex(index)
  }

  const closeGalleryImage = () => setGalleryFullIndex(null)

  const prevGalleryImage = () => {
    if (!galleryFeeder?.galleryImages) return
    setGalleryFullIndex((current) => {
      if (current === null) return 0
      return (current - 1 + galleryFeeder.galleryImages.length) % galleryFeeder.galleryImages.length
    })
  }

  const nextGalleryImage = () => {
    if (!galleryFeeder?.galleryImages) return
    setGalleryFullIndex((current) => {
      if (current === null) return 0
      return (current + 1) % galleryFeeder.galleryImages.length
    })
  }

  const openAuthSidebar = (mode = 'choice') => {
    setActiveSidebar('auth')
    setAuthMode(mode)
    setSelectedUser(null)
    setOnLocationSelectedAction(null)
  }

  const handleLogin = (user) => {
    setCurrentUser(user)
    setActiveSidebar(null)
  }

  const handleRegister = (userData) => {
    const newUser = {
      id: Date.now(),
      username: userData.username.trim() || `Użytkownik ${Date.now()}`,
      password: userData.password,
      avatar: defaultProfileIcon,
    }
    setUsers([...users, newUser])
    setCurrentUser(newUser)
    setActiveSidebar(null)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setAuthMode('choice')
    setSelectedUser(null)
    setOnLocationSelectedAction(null)
    setActiveSidebar(null)
  }

  const handleMapClick = (lat, lng) => {
    if (onLocationSelectedAction) {
      onLocationSelectedAction(lat, lng)
      setOnLocationSelectedAction(null)
    }
  }

  const readNewFeeder = (formData, lat, lng) => {
    const nowyKarmnik = {
      id: Date.now(),
      lat,
      lng,
      nazwa: formData.nazwa,
      image: Array.isArray(formData.atrybut2) && formData.atrybut2.length > 0
        ? formData.atrybut2[0]
        : formData.atrybut1 || '/assets/pics/feeders/obraz_przykl.jpg',
      galleryImages: Array.isArray(formData.atrybut2) ? formData.atrybut2 : [],
      videoLink: formData.atrybut3,
      opis: formData.atrybut1,
      adres: formData.atrybut1,
      author: currentUser ? currentUser.username : 'Anonim',
      userId: currentUser ? currentUser.id : null,
    }
    setFeeder([...feeders, nowyKarmnik])
    setActiveSidebar(null)
  }

  return {
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
    closeGallery,
    openOverlay,
    closeOverlay,
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
    BazaWiedzyLinki,
  }
}
