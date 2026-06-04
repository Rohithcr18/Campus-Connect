import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, FileText, Megaphone, Users, ArrowUpRight, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch analytics stats
        const analyticsRes = await api.get('/users/analytics');
        setAnalytics(analyticsRes.data);

        // 2. Fetch upcoming events (limit 3)
        const eventsRes = await api.get('/events?limit=3&dateFilter=upcoming');
        setRecentEvents(eventsRes.data.events);

        // 3. Fetch recent notices (limit 4)
        const noticesRes = await api.get('/notices?limit=4');
        setRecentNotices(noticesRes.data.notices);

        // 4. Fetch announcements (limit 3)
        const annRes = await api.get('/announcements');
        setRecentAnnouncements(annRes.data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateStr) => {
    try {
      const options = { month: 'short', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-violet-500 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]" />
        <div className="relative z-10 space-y-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/20 text-white">
            Portal Control Room
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-sm text-primary-50/80 max-w-xl">
            You are logged in as a <span className="font-bold underline capitalize">{user?.role}</span>. Here is the latest activity around the campus today.
          </p>
        </div>
      </div>

      {/* Analytics Grid */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card: Events */}
          <div className="glass-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Events</p>
              <h3 className="text-2xl font-black">{analytics.events}</h3>
              <p className="text-[10px] text-slate-400">Total active events</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card: Notices */}
          <div className="glass-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Notices</p>
              <h3 className="text-2xl font-black">{analytics.notices}</h3>
              <p className="text-[10px] text-slate-400">Official notice board posts</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Card: Announcements */}
          <div className="glass-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Announcements</p>
              <h3 className="text-2xl font-black">{analytics.announcements}</h3>
              <p className="text-[10px] text-slate-400">Active alerts posted</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
          </div>

          {/* Card: Registrations */}
          <div className="glass-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Registrations</p>
              <h3 className="text-2xl font-black">{analytics.registrations}</h3>
              <p className="text-[10px] text-slate-400">Total sign-ups submitted</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming Events & Announcements */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Upcoming Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Upcoming Campus Events</h3>
              <Link to="/events" className="text-xs font-bold text-primary-500 flex items-center gap-1 hover:underline">
                View all
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentEvents.length > 0 ? (
                recentEvents.slice(0, 2).map((event) => (
                  <div key={event._id} className="glass-card overflow-hidden group hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-200">
                    <div className="h-32 bg-slate-100 dark:bg-slate-800 relative">
                      {event.image ? (
                        <img
                          src={`http://localhost:5000${event.image}`}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-600 to-violet-500 flex items-center justify-center text-white/30 text-xs font-bold uppercase">
                          {event.category}
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/95 text-slate-800 border border-slate-200 backdrop-blur-md shadow-sm">
                        {event.category}
                      </span>
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span>📅 {formatDate(event.date)}</span>
                        <span>•</span>
                        <span>📍 {event.location}</span>
                      </p>
                      <Link
                        to={`/events/${event._id}`}
                        className="mt-2 block text-center py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Event Details
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sm:col-span-2 text-center py-10 text-slate-400 glass-card">
                  No upcoming events listed yet. Check back soon!
                </div>
              )}
            </div>
          </div>

          {/* Section: Recent Notices timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Recent Notices</h3>
              <Link to="/notices" className="text-xs font-bold text-primary-500 flex items-center gap-1 hover:underline">
                Notice Board
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentNotices.length > 0 ? (
                recentNotices.map((notice) => (
                  <div key={notice._id} className="glass-card p-5 flex items-start gap-4 hover:border-slate-300 dark:hover:border-slate-800 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                          {notice.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(notice.createdAt)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-950 dark:text-white truncate">
                        {notice.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {notice.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 glass-card">
                  No notices posted yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Latest Announcements (pinned alerts) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Announcements Desk</h3>
            <Link to="/announcements" className="text-xs font-bold text-primary-500 flex items-center gap-1 hover:underline">
              Inbox history
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentAnnouncements.length > 0 ? (
              recentAnnouncements.map((ann) => (
                <div
                  key={ann._id}
                  className={`p-5 rounded-2xl border transition-colors relative overflow-hidden flex flex-col gap-2 ${
                    ann.important
                      ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30'
                      : 'glass-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{formatDate(ann.createdAt)}</span>
                    {ann.important && (
                      <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase">
                        <Pin className="w-2.5 h-2.5 rotate-45" />
                        Important
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white truncate">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {ann.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 glass-card">
                No announcements published yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
