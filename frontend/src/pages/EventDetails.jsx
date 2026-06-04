import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Tag, Users, ArrowLeft, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to load event details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleRegisterToggle = async () => {
    try {
      const res = await api.post(`/events/register/${event._id}`);
      setToast({ type: 'success', message: res.data.message });
      setEvent((prev) => ({
        ...prev,
        registrations: res.data.registrations,
      }));
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to toggle registration.' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete(`/events/${event._id}`);
      setToast({ type: 'success', message: 'Event deleted successfully.' });
      setTimeout(() => {
        navigate('/events');
      }, 1000);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete event.' });
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  if (!event) {
    return (
      <div className="text-center py-20 glass-card">
        <p className="text-slate-400">Event not found.</p>
        <Link to="/events" className="mt-4 inline-block text-primary-500 hover:underline">
          Return to Events Directory
        </Link>
      </div>
    );
  }

  const isRegistered = event.registrations?.includes(user?.email);
  const isCreatorOrAdmin = user?.email === event.createdBy || user?.role === 'admin';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Back Button */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events Directory
      </Link>

      {/* Main Details Card */}
      <div className="glass-card overflow-hidden">
        {/* Banner Image */}
        <div className="h-64 sm:h-96 w-full bg-slate-100 dark:bg-slate-800 relative">
          {event.image ? (
            <img
              src={`http://localhost:5000${event.image}`}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-primary-600 via-primary-500 to-violet-500 flex items-center justify-center text-white/20 text-3xl font-black uppercase">
              {event.category}
            </div>
          )}
          
          {/* Category Tag overlay */}
          <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-slate-900 border backdrop-blur-md shadow-sm">
            {event.category}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {event.title}
              </h1>
              <p className="text-xs text-slate-400">
                Broadcasting hosted by <span className="font-semibold text-slate-600 dark:text-slate-300">{event.createdByName || 'Faculty Coordinator'}</span> ({event.createdBy})
              </p>
            </div>

            {/* Actions for Creator/Admin */}
            {isCreatorOrAdmin && (
              <div className="flex gap-2 self-start">
                <button
                  onClick={handleDelete}
                  className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                  title="Delete Event"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Details specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date & Time</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{formatDate(event.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Venue / Location</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{event.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Registers</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                  {event.registrations?.length || 0} enrolled
                </p>
              </div>
            </div>
          </div>

          {/* Description content */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Event Summary</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Student action buttons */}
          {user?.role === 'student' && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 pt-6">
              <button
                onClick={handleRegisterToggle}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                  isRegistered
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 shadow-none'
                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/20'
                }`}
              >
                {isRegistered ? 'Withdraw Registration (Cancel)' : 'Confirm Enrollment & Sign Up'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Roster of registrations: ONLY FOR CREATOR FACULTY OR ADMIN */}
      {isCreatorOrAdmin && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary-500" />
            Registered Students ({event.registrations?.length || 0})
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Faculty coordinators can view enrollment details below
          </p>

          {event.registrations && event.registrations.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 pl-4">#</th>
                    <th className="p-3">Student Email</th>
                    <th className="p-3 text-right pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {event.registrations.map((email, idx) => (
                    <tr key={email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="p-3 pl-4 font-mono text-xs">{idx + 1}</td>
                      <td className="p-3 font-semibold">{email}</td>
                      <td className="p-3 text-right pr-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Enrolled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No students have registered for this event yet.
            </div>
          )}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default EventDetails;
