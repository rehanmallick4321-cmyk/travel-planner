import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  DollarSign,
  Utensils,
  Landmark,
  Bed,
  Car,
  ShoppingBag,
  Music,
  Trees,
  Palette,
  Info,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getItinerary, getTrip, regenerateItinerary } from '../lib/api';

const TIME_SLOT_STYLES = {
  morning: 'bg-amber-100 text-amber-800',
  afternoon: 'bg-sky-100 text-sky-800',
  evening: 'bg-purple-100 text-purple-800',
  night: 'bg-indigo-100 text-indigo-800',
};

const CATEGORY_CONFIG = {
  attraction: { icon: Landmark, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  dining: { icon: Utensils, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  accommodation: { icon: Bed, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  transportation: { icon: Car, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  shopping: { icon: ShoppingBag, color: 'bg-pink-50 text-pink-700 border-pink-200' },
  entertainment: { icon: Music, color: 'bg-violet-50 text-violet-700 border-violet-200' },
  nature: { icon: Trees, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  culture: { icon: Palette, color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function ItineraryView() {
  const { tripId } = useParams();

  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripData, itineraryData] = await Promise.all([
        getTrip(tripId),
        getItinerary(tripId),
      ]);
      setTrip(tripData);
      setDays(itineraryData?.days || []);
      setActiveDay(0);
    } catch {
      toast.error('Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (e) => {
    e.preventDefault();
    setShowRegenModal(false);
    setRegenerating(true);
    try {
      const updated = await regenerateItinerary(tripId, feedback.trim() || null);
      setDays(updated?.days || []);
      setActiveDay(0);
      setFeedback('');
      toast.success('Itinerary updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="bg-white rounded-2xl p-8 border border-slate-200 space-y-4">
            <div className="h-6 w-64 bg-slate-200 rounded" />
            <div className="h-24 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  const currentDay = days[activeDay];

  return (
    <Layout>
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
                  What would you like to change?
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g., Add more food markets, slower pace on Day 2..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRegenModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium"
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

      <div className="max-w-4xl mx-auto">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Link
              to={`/trips/${tripId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Trip
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {trip?.destination} Itinerary
            </h1>
          </div>

          <button
            onClick={() => setShowRegenModal(true)}
            disabled={regenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-60 self-start sm:self-auto"
          >
            {regenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </>
            )}
          </button>
        </div>

        {days.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
            <p className="text-slate-600 mb-4">No itinerary has been generated for this trip yet.</p>
            <Link
              to={`/trips/${tripId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold"
            >
              Go Back & Generate
            </Link>
          </div>
        ) : (
          <>
            {/* Day Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
              {days.map((day, idx) => (
                <button
                  key={day.day_number}
                  onClick={() => setActiveDay(idx)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                    activeDay === idx
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Day {day.day_number}
                </button>
              ))}
            </div>

            {/* Active Day View */}
            {currentDay && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <div className="mb-8 pb-6 border-b border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-1">
                    Day {currentDay.day_number} {currentDay.date ? `• ${currentDay.date}` : ''}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {currentDay.title || `Day ${currentDay.day_number}`}
                  </h2>
                  {currentDay.summary && (
                    <p className="text-slate-600 italic leading-relaxed">{currentDay.summary}</p>
                  )}
                </div>

                {/* Vertical Timeline */}
                <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2.5 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {(currentDay.activities || []).map((activity, idx) => {
                    const cat = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.attraction;
                    const CatIcon = cat.icon;
                    const slotStyle =
                      TIME_SLOT_STYLES[activity.time_slot] || 'bg-slate-100 text-slate-700';

                    return (
                      <div key={idx} className="relative">
                        {/* Timeline dot */}
                        <span className="absolute -left-[22px] sm:-left-[26px] top-1.5 w-3.5 h-3.5 rounded-full bg-primary-600 ring-4 ring-white" />

                        <div className="rounded-2xl border border-slate-200/90 p-5 hover:border-primary-200 hover:shadow-sm bg-slate-50/40">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {activity.time_slot && (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${slotStyle}`}
                                >
                                  {activity.time_slot}
                                </span>
                              )}
                              {(activity.start_time || activity.end_time) && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  {activity.start_time || ''}
                                  {activity.start_time && activity.end_time ? ' – ' : ''}
                                  {activity.end_time || ''}
                                </span>
                              )}
                            </div>

                            {activity.category && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium border capitalize ${cat.color}`}
                              >
                                <CatIcon className="w-3.5 h-3.5" />
                                {activity.category}
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                            {activity.title}
                          </h3>

                          {activity.description && (
                            <p className="text-sm text-slate-600 leading-relaxed mb-3">
                              {activity.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                            {activity.location_name && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <strong className="text-slate-700">{activity.location_name}</strong>
                                {activity.location_address && ` (${activity.location_address})`}
                              </span>
                            )}
                            {activity.estimated_cost != null && (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                {activity.estimated_cost} {activity.currency || 'USD'}
                              </span>
                            )}
                          </div>

                          {activity.notes && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-100/80 border border-slate-200/70 flex items-start gap-2 text-xs text-slate-600">
                              <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                              <span>{activity.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
