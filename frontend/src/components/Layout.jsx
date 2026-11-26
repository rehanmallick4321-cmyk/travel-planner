import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plane, LayoutDashboard, PlusCircle, LogOut, Menu, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'New Trip', to: '/trips/new', icon: PlusCircle },
  ];

  const isActive = (path) => location.pathname === path;
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
                <Plane className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                TripCraft AI
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ label, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive(to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
                <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium text-slate-700 max-w-[140px] truncate">
                  {displayName}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {navItems.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-slate-700 truncate">{displayName}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm font-medium text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
