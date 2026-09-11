import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useStoreSettings, AdminWorkspace } from '../../context/StoreSettingsContext';

interface StaffUserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export const AdminTeamPage: React.FC = () => {
  const { admin, adminToken, updateAdminProfile } = useAuth();
  const { refreshSettings } = useStoreSettings();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Workspace State
  const [workspaceForm, setWorkspaceForm] = useState<AdminWorkspace>({
    tableDensity: 'relaxed',
    accentColor: '#C5A059',
    showKpiRevenue: true,
    showKpiOrders: true,
    showKpiAov: true,
    showKpiConversion: true
  });

  // 2. Staff State
  const [staffUsers, setStaffUsers] = useState<StaffUserItem[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'store_manager'
  });

  // 3. Admin Profile State
  const [adminProfileForm, setAdminProfileForm] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    currentPassword: '',
    newPassword: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    if (admin) {
      setAdminProfileForm(prev => ({
        ...prev,
        name: admin.name,
        email: admin.email
      }));
    }
  }, [admin]);

  const loadLiveSettings = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/settings/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.admin_workspace) setWorkspaceForm(data.admin_workspace);
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
    }
  };

  const loadStaff = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStaffUsers(data);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  };

  useEffect(() => {
    loadLiveSettings();
    loadStaff();
  }, [adminToken]);

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');
    
    if (adminProfileForm.currentPassword || adminProfileForm.newPassword) {
      if (!adminProfileForm.currentPassword || !adminProfileForm.newPassword) {
        setProfileMessage('Both current and new password are required to change password.');
        setIsSavingProfile(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/admin/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            currentPassword: adminProfileForm.currentPassword,
            newPassword: adminProfileForm.newPassword
          })
        });
        const data = await res.json();
        if (res.ok) {
          setProfileMessage('Password updated successfully.');
          setAdminProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        } else {
          setProfileMessage(data.error || 'Failed to update password.');
          setIsSavingProfile(false);
          return;
        }
      } catch {
        setProfileMessage('Error updating password.');
        setIsSavingProfile(false);
        return;
      }
    }

    const { success, error } = await updateAdminProfile({
      name: adminProfileForm.name,
      email: adminProfileForm.email
    });
    
    if (!success) {
      setProfileMessage(prev => prev ? `${prev} | ${error}` : (error || 'Failed to update details.'));
    } else {
      setProfileMessage(prev => prev ? `${prev} | Profile details updated.` : 'Profile details updated successfully.');
    }
    
    setIsSavingProfile(false);
    setTimeout(() => setProfileMessage(''), 4000);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    try {
      const url = editingStaffId ? `/api/admin/users/${editingStaffId}` : '/api/admin/users';
      const method = editingStaffId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(staffForm)
      });

      if (res.ok) {
        setIsStaffModalOpen(false);
        setEditingStaffId(null);
        setStaffForm({ name: '', email: '', password: '', role: 'store_manager' });
        await loadStaff();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save staff account.');
      }
    } catch {
      alert('Error saving staff account.');
    }
  };

  const openEditStaff = (u: StaffUserItem) => {
    setEditingStaffId(u.id);
    setStaffForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role
    });
    setIsStaffModalOpen(true);
  };

  const handleDeleteStaff = async (id: number) => {
    if (!adminToken || !confirm('Revoke staff credentials?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) await loadStaff();
      else {
        const err = await res.json();
        alert(err.error || 'Cannot delete account.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = (resource: string) => {
    if (!adminToken) return;
    fetch(`/api/settings/admin/export/${resource}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `macqrosa_${resource}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => alert('Export failed.'));
  };

  const handleSaveSection = async (sectionKey: string, payloadData: any) => {
    if (!adminToken) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          section: sectionKey,
          data: payloadData
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        await refreshSettings();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save settings.');
      }
    } catch (err) {
      setErrorMessage('Network error while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : ''}`}>
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6 pt-24 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-6 border-b border-surface-container mb-8">
            <div>
              <h1 className="text-2xl font-serif text-primary">Team & Workspace</h1>
              <p className="text-sm text-on-surface-variant mt-1">Manage staff access, layout density, and CSV exports.</p>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 animate-fade-in">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Changes Deployed Live</span>
                </div>
              )}
              {errorMessage && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                  <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 animate-fade-in">
            {/* Administrator Profile */}
            <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container">
                <div>
                  <h2 className="font-serif text-xl text-primary font-medium">Your Administrator Profile</h2>
                  <p className="text-xs text-on-surface-variant font-light mt-0.5">Manage your personal credentials and contact details.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateAdminProfile} className="space-y-6">
                {profileMessage && (
                  <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container text-xs text-primary font-medium">
                    {profileMessage}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-wider text-primary font-semibold border-b border-surface-container pb-2">Profile Details</h3>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        value={adminProfileForm.name}
                        onChange={e => setAdminProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        value={adminProfileForm.email}
                        onChange={e => setAdminProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-wider text-primary font-semibold border-b border-surface-container pb-2">Security (Optional)</h3>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Current Password</label>
                      <input
                        type="password"
                        placeholder="Leave blank if not changing"
                        value={adminProfileForm.currentPassword}
                        onChange={e => setAdminProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={adminProfileForm.newPassword}
                        onChange={e => setAdminProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-container">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isSavingProfile ? 'Saving...' : 'Update Profile'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Staff Directory */}
            <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container">
                <div>
                  <h2 className="font-serif text-xl text-primary font-medium">Place Vendôme Staff Directory</h2>
                  <p className="text-xs text-on-surface-variant font-light mt-0.5">Manage backoffice users, roles, and administrative permissions.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingStaffId(null);
                    setStaffForm({ name: '', email: '', password: '', role: 'store_manager' });
                    setIsStaffModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold font-semibold text-xs uppercase tracking-wider rounded shadow-sm hover:bg-black transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Induct Staff Member</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-semibold">Staff Member</th>
                      <th className="py-3 px-4 font-semibold">Work Email</th>
                      <th className="py-3 px-4 font-semibold">Assigned Role</th>
                      <th className="py-3 px-4 font-semibold">Induction Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {staffUsers.map(u => (
                      <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3.5 px-4 font-medium text-primary">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-secondary-gold/20 flex items-center justify-center text-primary font-serif font-bold text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant font-mono">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-secondary/15 text-secondary-fixed border border-secondary/30">
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 text-right">
                          {admin?.id !== u.id && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditStaff(u)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 rounded hover:bg-blue-50"
                                title="Edit Role & Password"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(u.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                                title="Revoke Credentials"
                              >
                                <span className="material-symbols-outlined text-[18px]">person_remove</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workspace Density, Exports & Maintenance */}
            <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
                <div>
                  <h2 className="font-serif text-xl text-primary font-medium">Workspace Density &amp; Data Audits</h2>
                  <p className="text-xs text-on-surface-variant font-light mt-0.5">Control operational spacing and execute one-click CSV ledger downloads.</p>
                </div>
                <button
                  onClick={() => handleSaveSection('admin_workspace', workspaceForm)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSaving ? 'Saving...' : 'Save Workspace'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Table Information Density</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setWorkspaceForm(prev => ({ ...prev, tableDensity: 'relaxed' }))}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        workspaceForm.tableDensity === 'relaxed'
                          ? 'border-secondary-gold bg-secondary-gold/5 ring-1 ring-secondary-gold'
                          : 'border-surface-container bg-surface-container-low'
                      }`}
                    >
                      <span className="material-symbols-outlined text-secondary text-[22px] mb-1 block">view_comfortable</span>
                      <h4 className="font-semibold text-xs text-primary">Relaxed Density</h4>
                      <p className="text-[10px] text-on-surface-variant font-light">Spacious editorial tables</p>
                    </div>

                    <div
                      onClick={() => setWorkspaceForm(prev => ({ ...prev, tableDensity: 'compact' }))}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        workspaceForm.tableDensity === 'compact'
                          ? 'border-secondary-gold bg-secondary-gold/5 ring-1 ring-secondary-gold'
                          : 'border-surface-container bg-surface-container-low'
                      }`}
                    >
                      <span className="material-symbols-outlined text-secondary text-[22px] mb-1 block">density_small</span>
                      <h4 className="font-semibold text-xs text-primary">Compact Density</h4>
                      <p className="text-[10px] text-on-surface-variant font-light">High efficiency data rows</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Instant CSV Exports</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleExport('orders')}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container hover:border-secondary text-primary font-medium text-xs text-left"
                    >
                      <span className="material-symbols-outlined text-secondary text-[18px]">download</span>
                      <span>Orders Ledger</span>
                    </button>
                    <button
                      onClick={() => handleExport('products')}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container hover:border-secondary text-primary font-medium text-xs text-left"
                    >
                      <span className="material-symbols-outlined text-secondary text-[18px]">download</span>
                      <span>Product Catalog</span>
                    </button>
                    <button
                      onClick={() => handleExport('inventory')}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container hover:border-secondary text-primary font-medium text-xs text-left"
                    >
                      <span className="material-symbols-outlined text-secondary text-[18px]">download</span>
                      <span>Inventory Reserves</span>
                    </button>
                    <button
                      onClick={() => handleExport('customers')}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container hover:border-secondary text-primary font-medium text-xs text-left"
                    >
                      <span className="material-symbols-outlined text-secondary text-[18px]">download</span>
                      <span>Patron Directory</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Add Staff Member */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 sm:p-8 border border-secondary/30 shadow-gold-xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
              <h3 className="font-serif text-xl text-primary font-medium">{editingStaffId ? 'Edit Staff Member' : 'Induct Staff Member'}</h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="p-1 text-on-surface-variant hover:text-primary rounded-lg">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Full Staff Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jacqueline Moreau"
                  value={staffForm.name}
                  onChange={e => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Official Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="jacqueline@macqrosa.com"
                  value={staffForm.email}
                  onChange={e => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Password</label>
                <input
                  type="password"
                  required={!editingStaffId}
                  placeholder={editingStaffId ? "Leave blank to keep unchanged" : "Minimum 8 characters"}
                  value={staffForm.password}
                  onChange={e => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Assigned Role</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                >
                  <option value="store_manager">Store Manager (Products, Orders, Reserves)</option>
                  <option value="super_admin">Super Admin (Full Maison Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container mt-6">
                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-primary">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded shadow-sm hover:bg-black transition-all">
                  {editingStaffId ? 'Save Changes' : 'Induct Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
