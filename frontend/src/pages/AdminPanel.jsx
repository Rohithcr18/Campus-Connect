import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, ClipboardList, CheckCircle, Trash2, ShieldCheck, ArrowRight, UserMinus } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('approvals');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Users filter states
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All');
  const [userPage, setUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);

  // Logs state pagination
  const [logPage, setLogPage] = useState(1);
  const [totalLogPages, setTotalLogPages] = useState(1);

  const fetchPendingApprovals = async () => {
    try {
      // Pending approvals are faculty accounts that are not approved yet
      // We will fetch users with query parameter filters in the users endpoint
      const res = await api.get('/users', {
        params: { role: 'faculty', limit: 100 },
      });
      const pending = res.data.users.filter((u) => !u.approved);
      setPendingFaculty(pending);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', {
        params: {
          search,
          role,
          page: userPage,
          limit: 10,
        },
      });
      setUsers(res.data.users);
      setTotalUserPages(res.data.pages);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to load users list.' });
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/users/logs', {
        params: {
          page: logPage,
          limit: 15,
        },
      });
      setLogs(res.data.logs);
      setTotalLogPages(res.data.pages);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to load audit logs.' });
    }
  };

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'approvals') {
      await fetchPendingApprovals();
    } else if (activeTab === 'users') {
      await fetchUsers();
    } else if (activeTab === 'logs') {
      await fetchLogs();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab, search, role, userPage, logPage]);

  const handleApproveFaculty = async (userId, userEmail) => {
    try {
      setLoading(true);
      await api.updateUserStatus(userId, { approved: true });
      setToast({ type: 'success', message: `Approved faculty registration: ${userEmail}` });
      await fetchPendingApprovals();
    } catch (err) {
      console.error(err);
      // Wait, we used updateUserStatus on api instance, but let's make sure api wrapper supports it or we call directly.
      // Yes, in routes/users.py: PUT /api/users/<id> updates status.
      // Let's call PUT directly using api.put(`/users/${userId}`) to be safe!
      try {
        await api.put(`/users/${userId}`, { approved: true });
        setToast({ type: 'success', message: `Approved faculty registration: ${userEmail}` });
        await fetchPendingApprovals();
      } catch (e) {
        setToast({ type: 'error', message: 'Failed to approve account.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you absolutely sure you want to delete user: ${userEmail}? This will wipe their login access permanently.`)) {
      return;
    }
    try {
      setLoading(true);
      await api.delete(`/users/${userId}`);
      setToast({ type: 'success', message: `Deleted account: ${userEmail}` });
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete user.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      setLoading(true);
      await api.put(`/users/${userId}`, { role: newRole });
      setToast({ type: 'success', message: 'User role updated successfully.' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to change user role.' });
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Admin Portal Control Room</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Approve faculty registrants, manage all user accounts, and review audit activity logs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === 'approvals'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Pending Approvals
          {pendingFaculty.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {pendingFaculty.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          User Registry
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Activity logs
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <div className="space-y-4">
          {/* TAB 1: PENDING APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pending Faculty Registrations</h3>
              {pendingFaculty.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingFaculty.map((item) => (
                    <div key={item._id} className="glass-card p-5 flex items-center justify-between border-l-4 border-l-amber-500">
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold text-slate-950 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 truncate">{item.email}</p>
                        <p className="text-[10px] text-slate-400">Created: {formatDate(item.createdAt)}</p>
                      </div>
                      
                      <button
                        onClick={() => handleApproveFaculty(item._id, item.email)}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10 flex items-center gap-1 shrink-0 ml-4 hover:scale-[1.02] transition-transform"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 glass-card">
                  No pending faculty approvals. All accounts verified!
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER REGISTRY */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              {/* Registry Search */}
              <div className="glass-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full sm:flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm"
                />
                
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full sm:w-44 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 focus:outline-none text-sm cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Users Table */}
              {users.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 glass-card">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4 pl-6">User details</th>
                        <th className="p-4">Assigned Role</th>
                        <th className="p-4">Faculty Verification</th>
                        <th className="p-4 text-center pr-6">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {users.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                          <td className="p-4 pl-6">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{item.name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[200px]">{item.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <select
                              value={item.role}
                              onChange={(e) => handleChangeRole(item._id, e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {item.role === 'faculty' ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                item.approved
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}>
                                {item.approved ? 'Approved' : 'Pending'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center pr-6">
                            <button
                              onClick={() => handleDeleteUser(item._id, item.email)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-200"
                              title="Delete Account"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 glass-card">
                  No users matching search query.
                </div>
              )}

              {/* Users Pagination */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-500">
                    Page {userPage} of {totalUserPages}
                  </span>
                  <button
                    disabled={userPage === totalUserPages}
                    onClick={() => setUserPage((p) => Math.min(p + 1, totalUserPages))}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVITY AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campus Portal Audit Trail</h3>
              {logs.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log._id} className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/10 flex items-start gap-4 text-xs">
                        <span className="px-2 py-0.5 rounded font-mono text-[9px] font-extrabold bg-primary-500/10 text-primary-500 border border-primary-500/20 uppercase shrink-0">
                          {log.action}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-300 leading-normal">
                            {log.details}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            By {log.email} • {formatDate(log.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Logs Pagination */}
                  {totalLogPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-4">
                      <button
                        disabled={logPage === 1}
                        onClick={() => setLogPage((p) => Math.max(p - 1, 1))}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-slate-505">
                        Page {logPage} of {totalLogPages}
                      </span>
                      <button
                        disabled={logPage === totalLogPages}
                        onClick={() => setLogPage((p) => Math.min(p + 1, totalLogPages))}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 glass-card">
                  No activity logs recorded.
                </div>
              )}
            </div>
          )}
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

export default AdminPanel;
