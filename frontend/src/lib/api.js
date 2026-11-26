import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach Supabase access token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ── Trip API ─────────────────────────────────────────

export const getTrips = () => api.get('/trips').then((r) => r.data);

export const getTrip = (id) => api.get(`/trips/${id}`).then((r) => r.data);

export const createTrip = (data) => api.post('/trips', data).then((r) => r.data);

export const updateTrip = (id, data) => api.put(`/trips/${id}`, data).then((r) => r.data);

export const deleteTrip = (id) => api.delete(`/trips/${id}`);

// ── Itinerary API ────────────────────────────────────

export const generateItinerary = (tripId) =>
  api.post('/itinerary/generate', { trip_id: tripId }).then((r) => r.data);

export const regenerateItinerary = (tripId, feedback = null) =>
  api.post('/itinerary/regenerate', { trip_id: tripId, feedback }).then((r) => r.data);

export const getItinerary = (tripId) =>
  api.get(`/itinerary/${tripId}`).then((r) => r.data);

export default api;
