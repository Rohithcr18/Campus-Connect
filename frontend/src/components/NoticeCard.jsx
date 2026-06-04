import React from 'react';
import { FileText, Calendar, Download, User, Edit, Trash2 } from 'lucide-react';

const NoticeCard = ({ notice, currentUserId, currentUserRole, onEdit, onDelete }) => {
  const { _id, title, content, category, attachment, createdBy, createdByName, createdAt } = notice;

  const categoryColors = {
    Academic: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Exam: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    Placement: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Admission: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    General: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  const getCol = (cat) => categoryColors[cat] || 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

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
    <div className="glass-card p-6 flex flex-col md:flex-row gap-5 items-start justify-between group hover:border-slate-300 dark:hover:border-slate-800 transition-colors duration-200">
      <div className="flex-1 space-y-3 min-w-0 w-full">
        {/* Category & Date */}
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getCol(category)}`}>
            {category}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
          {title}
        </h3>

        {/* Author info */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <User className="w-3.5 h-3.5 text-primary-500" />
          <span>By {createdByName || 'Faculty Member'} ({createdBy})</span>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>

        {/* Attachment Download */}
        {attachment && (
          <div className="pt-2">
            <a
              href={`http://localhost:5000${attachment}`}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
              Download Document
            </a>
          </div>
        )}
      </div>

      {/* Admin/Creator Edit Actions */}
      {isCreatorOrAdmin && (onEdit || onDelete) && (
        <div className="flex md:flex-col gap-2 shrink-0 self-end md:self-start w-full md:w-auto justify-end mt-4 md:mt-0">
          {onEdit && (
            <button
              onClick={() => onEdit(notice)}
              className="p-2 text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-200"
              title="Edit Notice"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(_id)}
              className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-200"
              title="Delete Notice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NoticeCard;
