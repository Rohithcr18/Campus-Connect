import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Shield, Image, Save, KeyRound } from 'lucide-react';
import Toast from '../components/Toast';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  
  // Profile info states
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageName, setProfileImageName] = useState('');
  
  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setToast({ type: 'error', message: 'Only PNG, JPG, JPEG, or WEBP images allowed.' });
        return;
      }
      setProfileImage(file);
      setProfileImageName(file.name);
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!name) {
      setToast({ type: 'error', message: 'Name cannot be blank.' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    const result = await updateProfile(formData);
    setLoading(false);

    if (result.success) {
      setToast({ type: 'success', message: result.message });
      setProfileImage(null);
      setProfileImageName('');
    } else {
      setToast({ type: 'error', message: result.message });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setToast({ type: 'error', message: 'Please enter current and new passwords.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setToast({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      setToast({ type: 'success', message: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setToast({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Account Profile</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal details, profile picture, and login security credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar Profile preview */}
        <div className="md:col-span-1 flex flex-col items-center p-6 glass-card text-center self-start space-y-4">
          <div className="relative">
            {user?.profileImage ? (
              <img
                src={`http://localhost:5000${user.profileImage}`}
                alt={user.name}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-primary-500/20 shadow-md shadow-primary-500/5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              style={{ display: user?.profileImage ? 'none' : 'flex' }}
              className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-violet-500 text-white text-3xl font-black items-center justify-center shadow-lg"
            >
              {getInitials(user?.name)}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
              {user?.name}
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{user?.email}</p>
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Shield className="w-3.5 h-3.5" />
            {user?.role}
          </div>
        </div>

        {/* Right Columns: Edit Tabs details */}
        <div className="md:col-span-2 space-y-8">
          {/* Card: Update Info */}
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              Update Information
            </h3>

            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={user?.email}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 focus:outline-none text-sm cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">Email addresses cannot be modified during active sessions.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Profile Image Banner
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Image className="w-4 h-4" />
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="profile-img-update"
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-img-update"
                    className="w-full flex items-center justify-between pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-sm"
                  >
                    <span className="truncate text-slate-400 max-w-[300px]">
                      {profileImageName ? profileImageName : 'Select new image file...'}
                    </span>
                    <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-lg border border-primary-500/20">
                      Browse
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all flex items-center gap-1.5 shadow-md shadow-primary-500/15 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </form>
          </div>

          {/* Card: Change Password */}
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary-500" />
              Security Password Details
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all flex items-center gap-1.5 shadow-md shadow-primary-500/15 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Change Password
              </button>
            </form>
          </div>
        </div>
      </div>

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

export default Profile;
