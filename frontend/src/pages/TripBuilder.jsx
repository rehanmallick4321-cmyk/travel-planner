import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import { MapPin, Calendar, Users, Sparkles, Minus, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { createTrip } from '../lib/api';

const BUDGET_OPTIONS = [
  {
    value: 'budget',
    label: 'Budget',
    emoji: '💰',
    description: 'Hostels, street food & public transit',
  },
  {
    value: 'mid-range',
    label: 'Mid-Range',
    emoji: '💰💰',
    description: 'Comfortable stays & local favorites',
  },
  {
    value: 'luxury',
    label: 'Luxury',
    emoji: '💰💰💰',
    description: 'Premium hotels, fine dining & private tours',
  },
];

const TRAVEL_STYLES = [
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'relaxation', label: 'Relaxation', emoji: '🏖️' },
  { value: 'cultural', label: 'Cultural', emoji: '🏛️' },
  { value: 'foodie', label: 'Foodie', emoji: '🍜' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'solo', label: 'Solo', emoji: '🎒' },
  { value: 'romantic', label: 'Romantic', emoji: '💑' },
];

export default function TripBuilder() {
  const navigate = useNavigate();

  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetLevel, setBudgetLevel] = useState('mid-range');
  const [travelStyle, setTravelStyle] = useState('cultural');
  const [numTravelers, setNumTravelers] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const numDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const diff = differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;
    return diff > 0 ? diff : null;
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!destination.trim()) {
      toast.error('Please enter a destination');
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be on or after start date');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        destination: destination.trim(),
        country: country.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        num_days: numDays || 3,
        budget_level: budgetLevel,
        travel_style: travelStyle,
        num_travelers: numTravelers,
        special_requests: specialRequests.trim() || null,
      };

      const created = await createTrip(payload);
      toast.success('Trip created! Ready to generate your itinerary.');
      navigate(`/trips/${created.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Plan Your Trip</h1>
          <p className="text-slate-600 mt-1">
            Tell us about your upcoming adventure and we&apos;ll tailor the perfect itinerary.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Destination */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">1. Where are you going?</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Destination City / Region <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Tokyo, Paris, Bali"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., Japan, France, Indonesia"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Travel Dates */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">2. Travel Dates</h2>
              </div>
              {numDays && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  {numDays} {numDays === 1 ? 'Day' : 'Days'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Budget Level */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">3. Budget Level</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {BUDGET_OPTIONS.map((option) => {
                const selected = budgetLevel === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBudgetLevel(option.value)}
                    className={`text-left p-4 rounded-xl border-2 ${
                      selected
                        ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xl mb-1.5">{option.emoji}</div>
                    <div className="font-semibold text-slate-900">{option.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Travel Style */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">4. Travel Style</h2>
            <div className="flex flex-wrap gap-3">
              {TRAVEL_STYLES.map((style) => {
                const selected = travelStyle === style.value;
                return (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setTravelStyle(style.value)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${
                      selected
                        ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{style.emoji}</span>
                    <span>{style.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Travelers & Special Requests */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">5. Travelers & Preferences</h2>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="font-medium text-slate-900">Number of Travelers</p>
                <p className="text-xs text-slate-500">Helps tailor group activities & dining</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNumTravelers((n) => Math.max(1, n - 1))}
                  className="w-9 h-9 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-slate-900">{numTravelers}</span>
                <button
                  type="button"
                  onClick={() => setNumTravelers((n) => Math.min(20, n + 1))}
                  className="w-9 h-9 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Special Requests or Notes (optional)
              </label>
              <textarea
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g., Vegetarian restaurants, wheelchair accessible, include a day trip to Kyoto..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold shadow-md shadow-primary-500/20 hover:from-primary-700 hover:to-indigo-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Trip...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Trip
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
