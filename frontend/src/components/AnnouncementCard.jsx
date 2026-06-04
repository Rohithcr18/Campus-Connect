import React from 'react';
import { Pin, Calendar, User, Edit, Trash2 } from 'lucide-react';

const AnnouncementCard = ({ announcement, currentUserId, currentUserRole, onEdit, onDelete }) => {
  const { _id, title, message, important, createdBy, createdByName, createdAt } = announcement;

  const formatDate = (dateStr) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateStr;
    }
  };

  const isCreatorOrAdmin = currentUserId === createdBy || currentUserRole === 'admin';

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row gap-5 items-start justify-between ${
      important
        ? 'bg-gradient-to-r from-primary-500/10 to-violet-500/10 border-primary-500/30 dark:border-primary-500/20 shadow-md shadow-primary-500/5'
        : 'glass-card'
    }`}>
      {/* Pinned background light effect */}
      {important && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/20 to-transparent rounded-bl-full pointer-events-none" />
      )}

      <div className="flex-1 space-y-3 min-w-0 w-full z-10">
        {/* Header: Pin + Title */}
        <div className="flex items-center gap-2">
          {important && (
            <span className="flex items-center gap-1 text-xs font-extrabold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Pin className="w-3 h-3 rotate-45" />
              Pinned
            </span>
          )}
          <h3 className="text-lg font-bold text-slate-950 dark:text-white truncate">
            {title}
          </h3>
        </div>

        {/* Content message */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/40 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>By {createdByName || 'Faculty Member'}</span>
          </div>
        </div>
      </div>

      {/* Admin/Creator Edit Actions */}
      {isCreatorOrAdmin && (onEdit || onDelete) && (
        <div className="flex md:flex-col gap-2 shrink-0 self-end md:self-start w-full md:w-auto justify-end mt-4 md:mt-0 z-10">
          {onEdit && (
            <button
              onClick={() => onEdit(announcement)}
              className="p-2 text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-200"
              title="Edit Announcement"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(_id)}
              className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-200"
              title="Delete Announcement"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;
