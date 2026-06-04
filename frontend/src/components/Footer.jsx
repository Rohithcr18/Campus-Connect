import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm py-6 px-4 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Campus Connect - College Event & Notice Portal. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Help Desk</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
