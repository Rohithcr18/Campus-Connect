import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Megaphone,
  UserCircle,
  ShieldAlert,
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      name: 'Events',
      path: '/events',
      icon: <CalendarDays className="w-5 h-5" />,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      name: 'Notices',
      path: '/notices',
      icon: <FileText className="w-5 h-5" />,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      name: 'Announcements',
      path: '/announcements',
      icon: <Megaphone className="w-5 h-5" />,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <UserCircle className="w-5 h-5" />,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      name: 'Admin Panel',
      path: '/admin',
      icon: <ShieldAlert className="w-5 h-5" />,
      roles: ['admin'],
    },
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/50 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-lg font-bold text-slate-950 dark:text-white">
              Campus Menu
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {filteredItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  toggleSidebar();
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/20">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-300 truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider font-bold">
                  {user.role}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
