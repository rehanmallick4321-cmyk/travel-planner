import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Map,
  Calendar,
  Globe2,
  Clock,
  Plus,
  MapPin,
  Users,
  ArrowRight,
  Compass,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getTrips } from '../lib/api';

const STATUS_BADGES = {
  draft: 'bg-slate-100 text-slate-700',
  generated: 'bg-emerald-100 text-emerald-700',
  saved: 'bg-blue-100 text-blue-700',
  archived: 'bg-amber-100 text-amber-700',
};

const BUDGET_BADGES = {
  budget: 'bg-green-50 text-green-700 border-green-200',
  'mid-range': 'bg-blue-50 text-blue-700 border-blue-200',
  luxury: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await getTrips();
      setTrips(data || []);
    } catch {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';
  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');

  const today = new Date().toISOString().split('T')[0];
  const upcomingCount = trips.filter((t) => t.start_date && t.start_date >= today).length;
  const countriesCount = new Set(
    trips.map((t) => t.country?.trim()).filter(Boolean)
  ).size;
  const totalDays = trips.reduce((sum, t) => sum + (Number(t.num_days) || 0), 0);

  const filteredTrips =
    statusFilter === 'all' ? trips : trips.filter((t) => t.status === statusFilter);

  const stats = [
    { label: 'Total Trips', value: trips.length, icon: Map, color: 'bg-blue-50 text-blue-600' },
    { label: 'Upcoming Trips', value: upcomingCount, icon: Calendar, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Countries', value: countriesCount, icon: Globe2, color: 'bg-purple-50 text-purple-600' },
    { label: 'Days Planned', value: totalDays, icon: Clock, color: 'bg-amber-50 text-amber-600' },
  ];

  const formatDateRange = (start, end) => {
    if (!start && !end) return 'Dates flexible';
    if (start && end) {
      return `${format(new Date(start), 'MMM d')} – ${format(new Date(end), 'MMM d, yyyy')}`;
    }
    return format(new Date(start || end), 'MMM d, yyyy');
  };

  return (
    <Layout>
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-slate-500">{todayStr}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
            Welcome back, {displayName}!
          </h1>
        </div>
        <Link
          to="/trips/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold shadow-md shadow-primary-500/20 hover:from-primary-700 hover:to-indigo-700"
        >
          <Plus className="w-5 h-5" />
          Create New Trip
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      {trips.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {['all', 'draft', 'generated', 'saved'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-6 w-32 bg-slate-200 rounded" />
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-44 bg-slate-200 rounded" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-20 bg-slate-200 rounded-lg" />
                <div className="h-6 w-20 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-5">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No trips yet!</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Start planning your first adventure. Tell our AI where you want to go and get a
            personalized day-by-day itinerary in seconds.
          </p>
          <Link
            to="/trips/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Plan Your First Trip
          </Link>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center">
          <p className="text-slate-600 font-medium">No trips match the &ldquo;{statusFilter}&rdquo; filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <Link
              key={trip.id}
              to={`/trips/${trip.id}`}
              className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600">
                      {trip.destination}
                    </h3>
                    {trip.country && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {trip.country}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      STATUS_BADGES[trip.status] || STATUS_BADGES.draft
                    }`}
                  >
                    {trip.status || 'draft'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                    {trip.num_days && (
                      <span className="text-slate-400">({trip.num_days}d)</span>
                    )}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>
                      {trip.num_travelers || 1}{' '}
                      {(trip.num_travelers || 1) === 1 ? 'Traveler' : 'Travelers'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {trip.budget_level && (
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border capitalize ${
                        BUDGET_BADGES[trip.budget_level] || 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {trip.budget_level}
                    </span>
                  )}
                  {trip.travel_style && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                      {trip.travel_style}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
