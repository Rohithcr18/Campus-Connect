import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Calendar, Image, MapPin } from 'lucide-react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Search / Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal creation state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedEventId, setSelectedEventId] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('Technical');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageFileName, setImageFileName] = useState('');

  const categories = ['Technical', 'Cultural', 'Sports', 'Workshops', 'Seminars'];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events', {
        params: {
          search,
          category,
          dateFilter,
          page,
          limit: 6,
        },
      });
      setEvents(res.data.events);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to fetch events.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, category, dateFilter, page]);

  const handleRegisterToggle = async (eventId) => {
    try {
      const res = await api.post(`/events/register/${eventId}`);
      setToast({ type: 'success', message: res.data.message });
      
      // Update local state to reflect change instantly
      setEvents((prev) =>
        prev.map((evt) => {
          if (evt._id === eventId) {
            return { ...evt, registrations: res.data.registrations };
          }
          return evt;
        })
      );
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to toggle registration.' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setToast({ type: 'error', message: 'Only PNG, JPG, JPEG, or WEBP images are allowed.' });
        return;
      }
      setImageFile(file);
      setImageFileName(file.name);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedEventId(null);
    setTitle('');
    setDescription('');
    setEventCategory('Technical');
    setDate('');
    setLocation('');
    setImageFile(null);
    setImageFileName('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !eventCategory || !date || !location) {
      setToast({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', eventCategory);
    formData.append('date', date);
    formData.append('location', location);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      setLoading(true);
      if (modalMode === 'create') {
        const res = await api.post('/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setToast({ type: 'success', message: res.data.message });
      } else {
        const res = await api.put(`/events/${selectedEventId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setToast({ type: 'success', message: res.data.message });
      }
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Action failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Campus Events Hub</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign up for technical, sports, and cultural festivals or workshops
          </p>
        </div>

        {/* Create button for Faculty and Admin */}
        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all shadow-md shadow-primary-500/25 flex items-center gap-1.5 self-start hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Host Event
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <SearchBar
        searchValue={search}
        onSearchChange={setSearch}
        categoryValue={category}
        onCategoryChange={setCategory}
        categories={categories}
        dateFilterValue={dateFilter}
        onDateFilterChange={setDateFilter}
        placeholder="Search event title, description or location..."
      />

      {/* Events Grid */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  currentUserId={user?.email}
                  onRegisterToggle={user?.role === 'student' ? handleRegisterToggle : null}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/40 dark:bg-slate-900/10 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/40 text-slate-500 dark:text-slate-400">
              No events found matching your search.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Host Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/50 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-1">
              Host Campus Event
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Fill details to broadcast this event to the campus directory
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1.5">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Campus Hackathon 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>

              {/* Event Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Category *
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Event Date *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Venue / Location *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Seminar Hall B / Indoor Gym"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Event Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an overview of the event, guidelines, and coordinate links..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>

              {/* Promotional Image File */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Banner Image (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Image className="w-4 h-4" />
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="event-img-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="event-img-upload"
                    className="w-full flex items-center justify-between pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-450 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-sm"
                  >
                    <span className="truncate text-slate-400 max-w-[250px]">
                      {imageFileName ? imageFileName : 'Select poster/banner file...'}
                    </span>
                    <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-lg border border-primary-500/20">
                      Browse
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-md shadow-primary-500/25 flex items-center justify-center gap-1.5"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
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

export default Events;
