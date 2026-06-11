const API_BASE_URL = 'http://localhost:8000/api';

// Helper do dodania tokena do nagłówków
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }
  
  return headers;
};

// Logowanie
export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login/`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.non_field_errors?.[0] || 'Logowanie nieudane');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    return data;
  } catch (error) {
    throw error;
  }
};

// Rejestracja
export const registerUser = async (username, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    return data;
  } catch (error) {
    throw error;
  }
};

// Pobranie profilu (wymaga autoryzacji)
export const getProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Nie udało się pobrać profilu');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Wylogowanie
export const logout = () => {
  localStorage.removeItem('authToken');
};

// Sprawdzenie czy użytkownik jest zalogowany
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

// Pobranie tokena
export const getToken = () => {
  return localStorage.getItem('authToken');
};

// Upload avatar (multipart)
export const uploadAvatar = async (file) => {
  try {
    const token = getToken();
    const form = new FormData();
    form.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/users/avatar/`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Token ${token}` } : {},
      body: form,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(err) || 'Upload failed');
    }

    return await response.json();
  } catch (err) {
    throw err;
  }
};

// Wyszukiwanie użytkowników
export const searchUsers = async (q = '') => {
  try {
    const url = `${API_BASE_URL}/users/list/` + (q ? `?q=${encodeURIComponent(q)}` : '');
    const response = await fetch(url, { headers: getHeaders(false) });
    if (!response.ok) throw new Error('Nie udało się pobrać listy użytkowników');
    return await response.json();
  } catch (err) {
    throw err;
  }
};

// Dodawanie karmnika (GeoJSON Feature z opcjonalnymi obrazami)
export const addFeeder = async (name, description, lat, lng, status = 'WITHOUT_CARE', imageFiles = null) => {
  try {
    // If there are images, use multipart/form-data
    if (imageFiles && imageFiles.length > 0) {
      const formData = new FormData();
      
      // Add feeder data
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          name,
          description,
          status,
        },
      };
      
      formData.append('feature', JSON.stringify(feature));
      
      // Add image files
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
      
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/map/api/objects/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Token ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(err) || 'Błąd przy dodawaniu karmnika');
      }

      return await response.json();
    } else {
      // No images - use JSON
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          name,
          description,
          status,
        },
      };

      const response = await fetch(`${API_BASE_URL}/map/api/objects/`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(feature),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(err) || 'Błąd przy dodawaniu karmnika');
      }

      return await response.json();
    }
  } catch (err) {
    throw err;
  }
};
