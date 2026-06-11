import { useState, useRef, useEffect } from 'react'
import { FakeKarmniki, FakeUzytkownicy, BazaWiedzyLinki } from './mockup_data'
import { getProfile, logout as apiLogout, isAuthenticated, addFeeder, searchUsers, updateFeeder, deleteFeeder, deleteImage, getFeederImages, getFeederDetails } from './api'

export function useMapkaState() {
  const [activeSidebar, setActiveSidebar] = useState(null)
  const [users, setUsers] = useState(FakeUzytkownicy)
  const [currentUser, setCurrentUser] = useState(null)
  const [authMode, setAuthMode] = useState('choice')
  
  // ZMIANA 1: Pusta tablica zamiast FakeKarmniki i poprawna nazwa setFeeders
  const [feeders, setFeeders] = useState([]) 
  
  const [galleryFeeder, setGalleryFeeder] = useState(null)
  const [galleryFullIndex, setGalleryFullIndex] = useState(null)
  const [onLocationSelectedAction, setOnLocationSelectedAction] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [overlayPane, setOverlayPane] = useState(null)
  const [editingFeeder, setEditingFeeder] = useState(null)
  const [notification, setNotification] = useState(null)
  const mapRef = useRef(null)
  const markerRefs = useRef({})

  // ZMIANA 2: Dodany useEffect pobierający dane z Django
  useEffect(() => {
    const fetchFeedersFromDjango = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/map/api/objects/');
        const data = await response.json();
        
        console.log('Initial fetch - API response:', data);
        // GeoJSON FeatureCollection: { type, features: [...] }
        const features = data.features || data;
        console.log('Initial fetch - Features:', features);
        
        const mappedFeeders = (features || []).map(feature => {
          // Safety checks for geometry
          if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length < 2) {
            console.warn('Invalid geometry for feature:', feature);
            return null;
          }
          
          // Get first image from images array or use default
          const images = feature.properties.images || [];
          const image = images.length > 0 ? images[0] : "/assets/pics/feeders/obraz_przykl.jpg";
          
          return {
            id: feature.properties.id || feature.id,
            nazwa: feature.properties.name,
            // W GeoJSON współrzędne to [lng, lat], więc zamieniamy kolejność dla React Leaflet
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
            opis: feature.properties.description,
            adres: feature.properties.description, 
            author: feature.properties.owner_username || 'Anonim',
            image: image, 
            galleryImages: images,
            videoLink: feature.properties.video_link || null,
            userId: feature.properties.owner_id || null
          };
        }).filter(f => f !== null);

        console.log('Initial fetch - Mapped feeders:', mappedFeeders);
        setFeeders(mappedFeeders);
      } catch (error) {
        console.error("Błąd podczas pobierania danych z Django:", error);
      }
    };

    fetchFeedersFromDjango();
  }, []);

  // Załaduj użytkownika z tokena przy starcie
  useEffect(() => {
    const loadUserFromToken = async () => {
      if (isAuthenticated()) {
        try {
          const userProfile = await getProfile();
          setCurrentUser({
            id: userProfile.id,
            username: userProfile.username,
            email: userProfile.email,
            join_date: userProfile.join_date,
            avatar: userProfile.avatar || '/assets/pics/profile_pics/profilowe_default.png',
          });
        } catch (error) {
          console.error("Błąd podczas ładowania profilu:", error);
          apiLogout();
          setCurrentUser(null);
        }
      }
    };

    loadUserFromToken();
  }, []);

  // Załaduj rzeczywistych użytkowników z API
  useEffect(() => {
    const loadUsersFromAPI = async () => {
      try {
        const allUsers = await searchUsers('');
        setUsers(allUsers || []);
      } catch (error) {
        console.error('Błąd podczas ładowania użytkowników:', error);
        // Jeśli nie uda się pobrać, zostaw mock data
      }
    };

    loadUsersFromAPI();
  }, []);

  // Funkcja do odświeżenia listy karmników z API
  const refreshFeedersFromAPI = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/map/api/objects/');
      const data = await response.json();
      
      console.log('API response data:', data);
      const features = data.features || data;
      console.log('Features array:', features);
      
      const mappedFeeders = (features || []).map(feature => {
        if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length < 2) {
          console.warn('Invalid geometry for feature:', feature);
          return null;
        }
        
        const images = feature.properties.images || [];
        const image = images.length > 0 ? images[0] : "/assets/pics/feeders/obraz_przykl.jpg";
        
        const feeder = {
          id: feature.properties.id || feature.id,
          nazwa: feature.properties.name,
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          opis: feature.properties.description,
          adres: feature.properties.description, 
          author: feature.properties.owner_username || 'Anonim',
          image: image, 
          galleryImages: images,
          videoLink: feature.properties.video_link || null,
          userId: feature.properties.owner_id || null
        };
        console.log('Mapped feeder:', feeder);
        return feeder;
      }).filter(f => f !== null);

      console.log('Final mapped feeders count:', mappedFeeders.length);
      setFeeders(mappedFeeders);
    } catch (error) {
      console.error("Błąd podczas odświeżenia karmników:", error);
    }
  };

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
    setCurrentUser(userData)
    setActiveSidebar(null)
  }

  const handleAvatarUpdated = (updatedUser) => {
    // updatedUser is serialized user from backend
    setCurrentUser((prev) => ({
      ...prev,
      avatar: updatedUser.avatar || prev?.avatar,
    }));
  }

  const handleLogout = () => {
    apiLogout()
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
    // Convert FileList to Array if images exist
    const imageFiles = formData.atrybut2 && formData.atrybut2.length > 0 
      ? Array.from(formData.atrybut2) 
      : null;
    
    // Wyślij do backendu w formacie GeoJSON (serializator oczekuje Feature)
    addFeeder(
      formData.nazwa || 'Karmnik', 
      formData.atrybut1 || '', 
      lat, 
      lng,
      'WITHOUT_CARE',
      imageFiles,
      formData.atrybut3 || ''
    )
      .then(async (created) => {
        console.log('Feeder created successfully:', created);
        // Refresh feeders from API to ensure persistence and display
        await refreshFeedersFromAPI();
        console.log('Feeders refreshed after creating new feeder');
        setActiveSidebar(null);
      })
      .catch((err) => {
        console.error('Błąd podczas zapisu karmnika:', err);
        // nadal zamykamy sidebar
        setActiveSidebar(null);
      });
  }

  const openEditFeeder = (feeder) => {
    // Check permissions
    if (currentUser && currentUser.id === feeder.userId) {
      // Pobierz obrazy dla feedera
      getFeederImages(feeder.id)
        .then(images => {
          setEditingFeeder({
            ...feeder,
            allImages: Array.isArray(images) ? images : images.results || []
          });
          setActiveSidebar('edit');
          // Enable geometry selection mode automatically
          setOnLocationSelectedAction(() => (lat, lng) => {
            setEditingFeeder(prev => ({
              ...prev,
              lat,
              lng
            }))
          })
        })
        .catch(err => {
          console.error('Błąd przy pobieraniu obrazów:', err);
          // Mimo błędu, otwórz edycję
          setEditingFeeder(feeder);
          setActiveSidebar('edit');
          setOnLocationSelectedAction(() => (lat, lng) => {
            setEditingFeeder(prev => ({
              ...prev,
              lat,
              lng
            }))
          })
        });
    } else {
      setNotification('Brak uprawnień do edycji tego obiektu');
      setTimeout(() => setNotification(null), 3000);
    }
  }

  const handleDeleteImage = (imageId) => {
    deleteImage(imageId)
      .then(async () => {
        console.log('Image deleted successfully');
        // Pobierz znowu obrazy
        const images = await getFeederImages(editingFeeder.id);
        setEditingFeeder(prev => ({
          ...prev,
          allImages: Array.isArray(images) ? images : images.results || []
        }));
      })
      .catch((err) => {
        console.error('Błąd przy usuwaniu obrazu:', err);
      });
  }

  const readEditFeeder = (formData, lat, lng) => {
    const imageFiles = formData.files && formData.files.length > 0 
      ? Array.from(formData.files) 
      : null;
    
    updateFeeder(
      formData.id,
      formData.nazwa || 'Karmnik',
      formData.opis || '',
      lat,
      lng,
      'WITHOUT_CARE',
      imageFiles,
      formData.link || ''
    )
      .then(async () => {
        console.log('Feeder updated successfully');
        await refreshFeedersFromAPI();
        setEditingFeeder(null);
        setActiveSidebar(null);
      })
      .catch((err) => {
        console.error('Błąd podczas aktualizacji karmnika:', err);
        setActiveSidebar(null);
      });
  }

  const readDeleteFeeder = (id) => {
    deleteFeeder(id)
      .then(async () => {
        console.log('Feeder deleted successfully');
        await refreshFeedersFromAPI();
        setEditingFeeder(null);
        setActiveSidebar(null);
      })
      .catch((err) => {
        console.error('Błąd podczas usuwania karmnika:', err);
        setActiveSidebar(null);
      });
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
    editingFeeder,
    notification,
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
  }
}