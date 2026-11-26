import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane,
  Sparkles,
  Heart,
  Zap,
  ArrowRight,
  MapPin,
  Sliders,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: Sparkles,
      title: 'Smart AI Planning',
      description:
        'Powered by Google Gemini to craft realistic, logically ordered day-by-day plans tailored to your destination.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Heart,
      title: 'Personalized Recommendations',
      description:
        'From street-food adventures to luxury escapes, every attraction, restaurant, and stay matches your travel style.',
      color: 'bg-rose-50 text-rose-600',
    },
    {
      icon: Zap,
      title: 'One-Click Itineraries',
      description:
        'Skip hours of research. Generate, refine with feedback, and organize complete trips in seconds.',
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  const steps = [
    {
      number: '01',
      icon: MapPin,
      title: 'Tell us your destination',
      description: 'Pick where you want to go, your travel dates, and how many people are joining.',
    },
    {
      number: '02',
      icon: Sliders,
      title: 'Set your preferences',
      description: 'Choose your budget tier, travel style, and any must-see spots or dietary notes.',
    },
    {
      number: '03',
      icon: CalendarCheck,
      title: 'Get your itinerary',
      description: 'Receive a structured day-by-day schedule with times, costs, and local tips.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <Plane className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">TripCraft AI</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 shadow-sm"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 shadow-sm"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-indigo-700 to-purple-700 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-6 border border-white/20">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI-Powered Travel Planning</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Plan Your Dream Trip with{' '}
              <span className="text-amber-300">AI</span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 mb-10 leading-relaxed">
              Turn your destination, budget, and travel style into a personalized day-by-day
              itinerary complete with attractions, dining, accommodations, and logistics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? '/trips/new' : '/signup'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary-700 font-semibold text-base shadow-lg hover:bg-blue-50"
              >
                {user ? 'Create a Trip' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 text-white font-semibold text-base border border-white/25 hover:bg-white/20"
              >
                Learn More
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Day-by-day timelines
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Budget-aware estimates
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Instant regeneration with feedback
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Everything you need to travel smarter
            </h2>
            <p className="text-slate-600">
              Eliminate decision fatigue and focus on experiences while AI handles the research.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2.5">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-600">
              From blank page to a complete itinerary in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative p-7 rounded-2xl border border-slate-200 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl font-extrabold text-primary-200">{step.number}</span>
                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Plane className="w-4 h-4 text-primary-600" />
            <span>TripCraft AI</span>
          </div>
          <p>© {new Date().getFullYear()} TripCraft AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
