import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, X, FileText, Upload } from 'lucide-react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import NoticeCard from '../components/NoticeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const Notices = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Search/Filters states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal posting states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedNoticeId, setSelectedNoticeId] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('Academic');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentFileName, setAttachmentFileName] = useState('');

  const categories = ['Academic', 'Exam', 'Placement', 'Admission', 'General'];

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notices', {
        params: {
          search,
          category,
          page,
          limit: 8,
        },
      });
      setNotices(res.data.notices);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to load notice board.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [search, category, page]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate PDF or office files
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
      ];
      if (!allowed.includes(file.type)) {
        setToast({ type: 'error', message: 'Supported formats: PDF, DOC, DOCX, PNG, JPG.' });
        return;
      }
      setAttachmentFile(file);
      setAttachmentFileName(file.name);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedNoticeId(null);
    setTitle('');
    setContent('');
    setNoticeCategory('Academic');
    setAttachmentFile(null);
    setAttachmentFileName('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (notice) => {
    setModalMode('edit');
    setSelectedNoticeId(notice._id);
    setTitle(notice.title);
    setContent(notice.content);
    setNoticeCategory(notice.category);
    setAttachmentFile(null);
    setAttachmentFileName(notice.attachment ? 'Keep existing document' : '');
    setModalOpen(true);
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Delete this notice from the board?')) return;
    try {
      setLoading(true);
      await api.delete(`/notices/${noticeId}`);
      setToast({ type: 'success', message: 'Notice deleted successfully.' });
      fetchNotices();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to delete notice.' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !noticeCategory) {
      setToast({ type: 'error', message: 'Please enter title, category and content.' });
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', noticeCategory);
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    try {
      setLoading(true);
      if (modalMode === 'create') {
        const res = await api.post('/notices', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setToast({ type: 'success', message: res.data.message });
      } else {
        const res = await api.put(`/notices/${selectedNoticeId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setToast({ type: 'success', message: res.data.message });
      }
      setModalOpen(false);
      fetchNotices();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to submit notice.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Notice Board</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Official documents, placement listings, and academic board postings
          </p>
        </div>

        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all shadow-md shadow-primary-500/25 flex items-center gap-1.5 self-start hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Post Notice
          </button>
        )}
      </div>

      {/* Filter Options */}
      <SearchBar
        searchValue={search}
        onSearchChange={setSearch}
        categoryValue={category}
        onCategoryChange={setCategory}
        categories={categories}
        placeholder="Search notice titles, categories, or text content..."
      />

      {/* Notice Feed */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <>
          {notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((notice) => (
                <NoticeCard
                  key={notice._id}
                  notice={notice}
                  currentUserId={user?.email}
                  currentUserRole={user?.role}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/40 dark:bg-slate-900/10 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/40 text-slate-500 dark:text-slate-400">
              No notices listed on the board.
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

      {/* Post/Edit Notice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/50 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            {/* Close */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-1">
              {modalMode === 'create' ? 'Post Campus Notice' : 'Edit Notice Posting'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Fill details to upload a notice or schedule layout onto the board
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1.5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Exam Timetable Sem 7 / Campus Placement Roster"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Category *
                  </label>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-705 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Content / Instructions *
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter content details, dates, regulations, and classroom locations..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                />
              </div>

              {/* PDF Document Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Attachment Document (PDF, Word, PNG)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Upload className="w-4 h-4" />
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    id="notice-doc-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="notice-doc-upload"
                    className="w-full flex items-center justify-between pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-sm"
                  >
                    <span className="truncate text-slate-400 max-w-[250px]">
                      {attachmentFileName ? attachmentFileName : 'Select PDF or DOC file...'}
                    </span>
                    <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-lg border border-primary-500/20">
                      Browse
                    </span>
                  </label>
                </div>
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
                  className="w-1/2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-md shadow-primary-500/25 flex items-center justify-center gap-1.5"
                >
                  {modalMode === 'create' ? 'Post Notice' : 'Update Notice'}
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

export default Notices;
