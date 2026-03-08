import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8080/api',
  withCredentials: true, // Crucial for sending/receiving Spring Security session cookies
});

export const generateVibePlaylist = async (image?: File | null, prompt?: string) => {
  const formData = new FormData();
  
  if (image) {
    formData.append('image', image);
  }
  
  if (prompt && prompt.trim() !== '') {
    formData.append('prompt', prompt.trim());
  }

  const response = await api.post('/vibe/generate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export default api;
