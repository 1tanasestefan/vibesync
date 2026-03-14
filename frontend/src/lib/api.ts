import axios from 'axios';

/**
 * Centralized Axios instance for all API calls to the Spring Boot backend.
 *
 * CRUCIAL: `withCredentials: true` ensures the JSESSIONID cookie (which holds
 * the OAuth2 session) is sent with every request.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8080/api',
  withCredentials: true,
});

// ─── Vibe Generation ───

export const generateVibePlaylist = async (image?: File | null, prompt?: string, playlistLength?: number) => {
  const formData = new FormData();
  if (image) formData.append('image', image);
  if (prompt && prompt.trim() !== '') formData.append('prompt', prompt.trim());
  if (playlistLength) formData.append('playlistLength', playlistLength.toString());

  const response = await api.post('/vibe/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ─── History ───

export const getHistory = async () => {
  const response = await api.get('/vibe/history');
  return response.data;
};

// ─── Trending ───

export const getTrending = async () => {
  const response = await api.get('/trending');
  return response.data;
};

// ─── User Profile ───

export const getUserProfile = async () => {
  const response = await api.get('/user/me');
  return response.data;
};

// ─── Spotify Library Operations ───

export const saveTrack = async (trackId: string) => {
  const response = await api.post('/spotify/save-track', { trackId });
  return response.data;
};

export const createPlaylist = async (name: string, trackUris: string[]) => {
  const response = await api.post('/spotify/create-playlist', { name, trackUris });
  return response.data;
};

// ─── Auth ───

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export default api;
