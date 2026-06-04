import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Megaphone, Pin } from 'lucide-react';
import api from '../services/api';
import AnnouncementCard from '../components/AnnouncementCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal forms
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAnnId, setSelectedAnnId] = useState(null);

  // Fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [important, setImportant] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to fetch announcements.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedAnnId(null);
    setTitle('');
    setMessage('');
    setImportant(false);
    setModalOpen(true);
  };

  const handleOpenEditModal = (ann) => {
    setModalMode('edit');
    setSelectedAnnId(ann._id);
    setTitle(ann.title);
    setMessage(ann.message);
    setImportant(ann.important);
    setModalOpen(true);
  };

  const handleDelete = async (annId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      setLoading(true);
      await api.delete(`/announcements/${annId}`);
      setToast({ type: 'success', message: 'Announcement deleted.' });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to delete announcement.' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      setToast({ type: 'error', message: 'Please enter title and message content.' });
      return;
    }

    const payload = { title, message, important };
    try {
      setLoading(true);
      if (modalMode === 'create') {
        const res = await api.post('/announcements', payload);
        setToast({ type: 'success', message: res.data.message });
      } else {
        const res = await api.put(`/announcements/${selectedAnnId}`, payload);
        setToast({ type: 'success', message: res.data.message });
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to submit announcement.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Announcements Desk</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Urgent updates, pinned broadcasts, and messages from Faculty/Administration
          </p>
        </div>

        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all shadow-md shadow-primary-500/25 flex items-center gap-1.5 self-start hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Publish Alert
          </button>
        )}
      </div>

      {/* Feed list */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <div className="space-y-4">
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <AnnouncementCard
                key={ann._id}
                announcement={ann}
                currentUserId={user?.email}
                currentUserRole={user?.role}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-white/40 dark:bg-slate-900/10 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/40 text-slate-500 dark:text-slate-400">
              No announcements published on the desk.
            </div>
          )}
        </div>
      )}

      {/* Modal Publish Form */}
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
              {modalMode === 'create' ? 'Publish Announcement' : 'Edit Announcement'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Broadcast critical info or pin notes to the student body dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Campus Health Advisory / Guest Lecture Broadcast"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter details of announcement, venue shifts or coordination updates..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>

              {/* Important Checkbox (to pin it) */}
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="important-pin"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 border-slate-300 dark:border-slate-800 focus:ring-primary-500/50 bg-slate-50 dark:bg-slate-950/30 cursor-pointer"
                />
                <label htmlFor="important-pin" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 rotate-45 text-amber-500" />
                  Pin announcement to top of dashboard feed (Important)
                </label>
              </div>

              {/* Submit triggers */}
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
                  className="w-1/2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-md shadow-primary-500/25"
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

export default Announcements;
