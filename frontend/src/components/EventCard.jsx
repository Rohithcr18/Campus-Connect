import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Tag } from 'lucide-react';

const EventCard = ({ event, currentUserId, onRegisterToggle }) => {
  const { _id, title, description, category, date, location, image, registrations, createdByName } = event;
  const regCount = registrations ? registrations.length : 0;
  const isRegistered = registrations ? registrations.includes(currentUserId) : false;

  const categoryColors = {
    Technical: 'from-blue-600 to-indigo-500 bg-blue-500/10 text-blue-400 border-blue-500/20',
    Cultural: 'from-pink-600 to-rose-500 bg-pink-500/10 text-pink-400 border-pink-500/20',
    Sports: 'from-emerald-600 to-teal-500 bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Workshops: 'from-amber-600 to-orange-500 bg-amber-500/10 text-amber-400 border-amber-500/20',
    Seminars: 'from-purple-600 to-violet-500 bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  const getCol = (cat) => categoryColors[cat] || 'from-slate-600 to-slate-500 bg-slate-500/10 text-slate-400 border-slate-500/20';

  const formatDate = (dateStr) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="glass-card overflow-hidden group hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* Event Header Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {image ? (
          <img
            src={`http://localhost:5000${image}`}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getCol(category).split(' ')[0]} ${getCol(category).split(' ')[1]} flex items-center justify-center`}>
            <Calendar className="w-12 h-12 text-white/50" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${getCol(category).split(' ').slice(2).join(' ')}`}>
            {category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-500 transition-colors">
          {title}
        </h3>
        
        <p className="text-xs text-slate-400 mt-1">
          By {createdByName || 'Faculty Member'}
        </p>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 flex-1">
          {description}
        </p>

        {/* Date and Location Info */}
        <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-primary-500" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Users className="w-4 h-4 text-primary-500" />
            <span>{regCount} {regCount === 1 ? 'Registration' : 'Registrations'}</span>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/events/${_id}`}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Details
            </Link>

            {onRegisterToggle && (
              <button
                onClick={() => onRegisterToggle(_id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  isRegistered
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/10'
                }`}
              >
                {isRegistered ? 'Leave' : 'Join'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
