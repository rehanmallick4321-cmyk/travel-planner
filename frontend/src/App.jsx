import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import TripBuilder from './pages/TripBuilder';
import TripDetail from './pages/TripDetail';
import ItineraryView from './pages/ItineraryView';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/new"
          element={
            <ProtectedRoute>
              <TripBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId"
          element={
            <ProtectedRoute>
              <TripDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/itinerary"
          element={
            <ProtectedRoute>
              <ItineraryView />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
