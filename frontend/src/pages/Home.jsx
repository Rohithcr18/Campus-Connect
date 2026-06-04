import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, FileText, Megaphone, Shield, ArrowRight } from 'lucide-react';
import api from '../services/api';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ events: 0, notices: 0, announcements: 0 });

  useEffect(() => {
    // Quick public health check or grab stats if possible (handles fallback if not authenticated yet)
    const fetchPublicStats = async () => {
      try {
        if (user) {
          const res = await api.get('/users/analytics');
          setStats(res.data);
        } else {
          // Fake mock stats for landing page if guest
          setStats({ events: 12, notices: 28, announcements: 8 });
        }
      } catch (err) {
        setStats({ events: 12, notices: 28, announcements: 8 });
      }
    };
    fetchPublicStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-20 md:pt-32 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.15),transparent_40%)]" />

        <div className="max-w-7xl mx-auto px-6 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-primary-500/10 border border-primary-500/30 text-primary-600 dark:text-primary-400">
            Welcome to the Campus Portal
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight">
            Connecting Students, Faculty & Administrators In One Hub
          </h1>

          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Campus Connect is a central ecosystem to register for technical hackathons, access notice boards, view exam tables, and follow pinned admin announcements.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-violet-600 text-white font-bold hover:from-primary-500 hover:to-violet-500 shadow-lg shadow-primary-500/25 flex items-center gap-2 hover:scale-[1.03] transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-500 shadow-lg shadow-primary-500/20 flex items-center gap-2 hover:scale-[1.03] transition-all"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Quick Statistics Banner */}
      <section className="py-12 border-y border-slate-200/50 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <p className="text-4xl md:text-5xl font-black bg-gradient-to-br from-primary-500 to-indigo-500 bg-clip-text text-transparent">
              {stats.events}+
            </p>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Campus Events</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl md:text-5xl font-black bg-gradient-to-br from-violet-500 to-purple-500 bg-clip-text text-transparent">
              {stats.notices}+
            </p>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Official Notices</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl md:text-5xl font-black bg-gradient-to-br from-pink-500 to-rose-500 bg-clip-text text-transparent">
              {stats.announcements}+
            </p>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Announcements</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight">Everything you need in one portal</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tailored dashboards for students, faculty coordinators, and security administrators.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 space-y-4 hover:border-primary-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Event Hub</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Explore and filter cultural festivals, coding workshops, and sports matches. Instantly sign up or coordinate registration trackers.
            </p>
          </div>

          <div className="glass-card p-8 space-y-4 hover:border-violet-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Notice Boards</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Search by academic details, placement schedules, or examination changes. Safely read and download official notice attachments.
            </p>
          </div>

          <div className="glass-card p-8 space-y-4 hover:border-pink-500/30 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Announcements</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Stay in the loop with pinned urgent alerts direct from the Dean's Desk. Historical logs are stored chronologically.
            </p>
          </div>
        </div>
      </section>

      {/* Admin seeding reminder footer banner */}
      <section className="mx-6 mb-16">
        <div className="max-w-5xl mx-auto p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(circle,rgba(99,102,241,0.1),transparent_50%)]" />
          <div className="space-y-2 z-10">
            <h4 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-400" />
              Administrative Mode Enabled
            </h4>
            <p className="text-xs text-slate-400 max-w-xl">
              Seed accounts have been pre-installed for development. To manage faculty registrations or review platform logs, use the default administrator account credentials.
            </p>
          </div>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-100 transition-colors z-10 text-sm whitespace-nowrap"
          >
            Admin Sign In
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
