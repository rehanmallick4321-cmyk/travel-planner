import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Compass,
  Sparkles,
  RefreshCw,
  Trash2,
  Eye,
  Loader2,
  MessageSquare,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import {
  getTrip,
  deleteTrip,
  generateItinerary,
  regenerateItinerary,
} from '../lib/api';

const LOADING_MESSAGES = [
  'Finding the best local restaurants...',
  'Mapping out scenic routes and attractions...',
  'Balancing your budget and travel pace...',
  'Adding hidden gems and insider tips...',
];

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [generating]);

  const loadTrip = async () => {
    try {
      setLoading(true);
      const data = await getTrip(tripId);
      setTrip(data);
    } catch {
      toast.error('Trip not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateItinerary(tripId);
      toast.success('Itinerary generated!');
      navigate(`/trips/${tripId}/itinerary`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate itinerary');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (e) => {
    e.preventDefault();
    setShowRegenModal(false);
    setGenerating(true);
    try {
      await regenerateItinerary(tripId, feedback.trim() || null);
      toast.success('Itinerary regenerated!');
      setFeedback('');
      navigate(`/trips/${tripId}/itinerary`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to regenerate itinerary');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTrip(tripId);
      toast.success('Trip deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete trip');
      setDeleting(false);
    }
  };

  const formatDateRange = (start, end) => {
    if (!start && !end) return 'Dates flexible';
    if (start && end) {
      return `${format(new Date(start), 'MMM d, yyyy')} – ${format(new Date(end), 'MMM d, yyyy')}`;
    }
    return format(new Date(start || end), 'MMM d, yyyy');
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-36 bg-slate-200 rounded" />
          <div className="bg-white rounded-2xl p-8 border border-slate-200 space-y-4">
            <div className="h-9 w-64 bg-slate-200 rounded" />
            <div className="h-5 w-48 bg-slate-200 rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!trip) return null;

  const hasItinerary = trip.status === 'generated' || trip.status === 'saved';

  return (
    <Layout>
      {/* Generating Overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-5 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Crafting your {trip.destination} itinerary...
            </h3>
            <p className="text-slate-600 text-sm mb-6">{LOADING_MESSAGES[loadingMsgIdx]}</p>
            <div className="flex items-center justify-center gap-2 text-primary-600 text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Powered by Google Gemini</span>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Regenerate Itinerary</h3>
              <button
                onClick={() => setShowRegenModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Optional feedback for the AI
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g., More outdoor activities, less museums, add a vegetarian dinner spot..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRegenModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Trip?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete your trip to <strong>{trip.destination}</strong>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Trip Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold text-slate-900">{trip.destination}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize bg-primary-50 text-primary-700">
                  {trip.status || 'draft'}
                </span>
              </div>
              {trip.country && (
                <p className="text-slate-500 flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-4 h-4" />
                  {trip.country}
                </p>
              )}
              <p className="text-slate-600 flex items-center gap-1.5 mt-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                {formatDateRange(trip.start_date, trip.end_date)}
                {trip.num_days && <span className="text-slate-400">• {trip.num_days} days</span>}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!hasItinerary ? (
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold shadow-md shadow-primary-500/20 hover:from-primary-700 hover:to-indigo-700"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Itinerary with AI
                </button>
              ) : (
                <>
                  <Link
                    to={`/trips/${trip.id}/itinerary`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold shadow-md shadow-primary-500/20 hover:from-primary-700 hover:to-indigo-700"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Itinerary
                  </Link>
                  <button
                    onClick={() => setShowRegenModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Wallet className="w-4 h-4" />
              <span>Budget Level</span>
            </div>
            <p className="text-lg font-bold text-slate-900 capitalize">
              {trip.budget_level || 'Mid-range'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Compass className="w-4 h-4" />
              <span>Travel Style</span>
            </div>
            <p className="text-lg font-bold text-slate-900 capitalize">
              {trip.travel_style || 'Cultural'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>Travelers</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {trip.num_travelers || 1}{' '}
              {(trip.num_travelers || 1) === 1 ? 'Person' : 'People'}
            </p>
          </div>
        </div>

        {/* Special Requests */}
        {trip.special_requests && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              <span>Special Requests</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{trip.special_requests}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
