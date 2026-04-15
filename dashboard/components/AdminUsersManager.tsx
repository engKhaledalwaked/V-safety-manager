import React, { useEffect, useMemo, useState } from 'react';
import { AdminAPI, AdminDashboardUser, AdminUserHistoryEntry, AdminUserRole } from '../../services/server';
import ConfirmationModal from './ConfirmationModal';
import ToastMessage from './ToastMessage';

interface AdminUsersManagerProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardService: AdminAPI;
  currentAdminEmail?: string;
}

type AdminFormState = {
  email: string;
  password: string;
  role: AdminUserRole;
};

const EMPTY_FORM: AdminFormState = {
  email: '',
  password: '',
  role: 'admin'
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString('en-GB', { hour12: false });
};

const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  isOpen,
  onClose,
  dashboardService,
  currentAdminEmail
}) => {
  const [admins, setAdmins] = useState<AdminDashboardUser[]>([]);
  const [history, setHistory] = useState<AdminUserHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminDashboardUser | null>(null);
  const [toastState, setToastState] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const [createForm, setCreateForm] = useState<AdminFormState>(EMPTY_FORM);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AdminFormState>(EMPTY_FORM);

  const superAdminCount = useMemo(() => {
    return admins.filter((admin) => admin.role === 'superadmin').length;
  }, [admins]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [adminUsers, adminHistory] = await Promise.all([
        dashboardService.getAdminUsers(),
        dashboardService.getAdminUsersHistory(30)
      ]);

      setAdmins(adminUsers);
      setHistory(adminHistory);
    } catch (error) {
      console.error('Failed to load admin users:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load admin users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen]);

  const resetCreateForm = () => {
    setCreateForm(EMPTY_FORM);
  };

  const handleStartEdit = (admin: AdminDashboardUser) => {
    setEditingUserId(admin.id);
    setEditForm({
      email: admin.email,
      password: '',
      role: admin.role
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm(EMPTY_FORM);
  };

  const handleCreate = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await dashboardService.addAdminUser(createForm, currentAdminEmail);
      resetCreateForm();
      setSuccessMessage('Admin user created successfully.');
      await loadData();
    } catch (error) {
      console.error('Failed to create admin user:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create admin user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUserId) return;

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await dashboardService.updateAdminUser(editingUserId, {
        email: editForm.email,
        password: editForm.password,
        role: editForm.role
      }, currentAdminEmail);

      setSuccessMessage('Admin user updated successfully.');
      setEditingUserId(null);
      setEditForm(EMPTY_FORM);
      await loadData();
    } catch (error) {
      console.error('Failed to update admin user:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update admin user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (admin: AdminDashboardUser) => {
    const isLastSuperAdmin = admin.role === 'superadmin' && superAdminCount <= 1;
    if (isLastSuperAdmin) {
      setErrorMessage('Cannot delete the last super admin.');
      setToastState({ isOpen: true, message: 'Cannot delete the last super admin.', type: 'error' });
      return;
    }

    setDeleteTarget(admin);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await dashboardService.deleteAdminUser(deleteTarget.id, currentAdminEmail);
      setSuccessMessage('Admin user deleted successfully.');
      setToastState({ isOpen: true, message: 'Admin user deleted successfully.', type: 'success' });
      if (editingUserId === deleteTarget.id) {
        handleCancelEdit();
      }
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete admin user:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete admin user');
      setToastState({
        isOpen: true,
        message: error instanceof Error ? error.message : 'Failed to delete admin user',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Admin Users Manager</h3>
            <p className="text-sm text-gray-500">Create, edit, and delete dashboard admins.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl leading-none"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50 flex-1 space-y-6">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          )}
          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <h4 className="font-bold text-gray-800">Add New Admin</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, role: (e.target.value as AdminUserRole) }))}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-4 py-2"
              >
                Create
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h4 className="font-bold text-gray-800">Current Admin Users</h4>
              <span className="text-xs text-gray-500">{admins.length} users</span>
            </div>

            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : admins.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No admin users found.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {admins.map((admin) => {
                  const isEditing = editingUserId === admin.id;
                  const isSelf = currentAdminEmail && currentAdminEmail.toLowerCase() === admin.email.toLowerCase();
                  const isDeleteDisabled = admin.role === 'superadmin' && superAdminCount <= 1;

                  return (
                    <div key={admin.id} className="p-4">
                      {!isEditing ? (
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              {admin.email}
                              {isSelf && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">You</span>}
                              {admin.role === 'superadmin' && <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">Super Admin</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Last login: {formatDate(admin.lastLogin)} | Updated: {formatDate(admin.updatedAt)}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartEdit(admin)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(admin)}
                              disabled={isSaving || isDeleteDisabled}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm"
                              title={isDeleteDisabled ? 'Last super admin cannot be deleted' : ''}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="Email"
                            className="border border-gray-300 rounded-lg px-3 py-2"
                          />
                          <input
                            type="text"
                            value={editForm.password}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                            placeholder="New password (optional)"
                            className="border border-gray-300 rounded-lg px-3 py-2"
                          />
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, role: (e.target.value as AdminUserRole) }))}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                          >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h4 className="font-bold text-gray-800">Recent Admin Changes</h4>
            </div>
            {history.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No history yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {history.map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="px-4 py-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                    <div className="text-gray-700">
                      <span className="font-semibold uppercase mr-2">{entry.action}</span>
                      <span>{entry.targetEmail}</span>
                      <span className="text-gray-500"> ({entry.targetRole})</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      By: {entry.actorEmail || 'unknown'} | {formatDate(entry.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete Admin User"
        message={deleteTarget ? `Are you sure you want to delete ${deleteTarget.email}?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isProcessing={isSaving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastMessage
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState({ isOpen: false, message: '', type: 'info' })}
      />
    </div>
  );
};

export default AdminUsersManager;
