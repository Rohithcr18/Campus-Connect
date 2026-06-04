import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 animate-pulse">
        <HelpCircle className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        The link you followed may be broken or the page has been removed. Check the URL and try again.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-md shadow-primary-500/20"
      >
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
