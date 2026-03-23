import React, { useEffect, useMemo, useState } from 'react';

export default function UserAccounts({ apiUrl, token }) {
  const roleOptions = useMemo(
    () => ['SystemAdmin', 'Admin', 'Player', 'PendingPlayer'],
    []
  );

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [mode, setMode] = useState('create'); // create | edit
  const [editingId, setEditingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const emptyForm = useMemo(
    () => ({
      username: '',
      identityNumber: '',
      email: '',
      password: '',
      role: 'Player',
      isApproved: false,
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!token) return;
    loadUsers();
  }, [apiUrl, token]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${apiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to load users');

      setUsers(data.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function applyDefaultApprovalForRole(nextRole) {
    // System Admins/Admins must be approved to be able to login (backend checks IsApproved).
    if (nextRole === 'SystemAdmin' || nextRole === 'Admin') return true;
    return false;
  }

  function resetForm() {
    setMode('create');
    setEditingId(null);
    setSelectedUser(null);
    setForm(emptyForm);
  }

  function onChangeRole(nextRole) {
    setForm((prev) => ({
      ...prev,
      role: nextRole,
      isApproved: applyDefaultApprovalForRole(nextRole),
    }));
  }

  function startEdit(user) {
    setMode('edit');
    setEditingId(user.id);
    setSelectedUser(user);

    setForm({
      username: user.username || '',
      identityNumber: user.identityNumber || '',
      email: user.email || '',
      password: '',
      role: user.role || 'Player',
      isApproved: !!user.isApproved,
    });
  }

  async function createUser() {
    setError('');
    setSuccess('');

    const payload = {
      username: form.username.trim(),
      identityNumber: form.identityNumber.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      isApproved: !!form.isApproved,
    };

    if (
      !payload.username ||
      !payload.identityNumber ||
      !payload.email ||
      !payload.password ||
      !payload.role
    ) {
      setError('All fields are required for creating a user.');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to create user');

      setSuccess(data.message || 'User created successfully');
      resetForm();
      await loadUsers();
    } catch (e) {
      setError(e.message || 'Failed to create user');
    }
  }

  async function updateUser() {
    setError('');
    setSuccess('');

    if (!editingId) {
      setError('No user selected for editing.');
      return;
    }

    const payload = {
      username: form.username.trim(),
      identityNumber: form.identityNumber.trim(),
      email: form.email.trim(),
      role: form.role,
      isApproved: !!form.isApproved,
    };

    // Optional password update
    if (form.password && form.password.trim()) {
      payload.password = form.password;
    }

    try {
      const res = await fetch(`${apiUrl}/users/${editingId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to update user');

      setSuccess(data.message || 'User updated successfully');
      resetForm();
      await loadUsers();
    } catch (e) {
      setError(e.message || 'Failed to update user');
    }
  }

  async function deleteUser(id) {
    if (!window.confirm('Delete this user account? This cannot be undone.')) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${apiUrl}/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to delete user');

      setSuccess(data.message || 'User deleted successfully');
      if (selectedUser?.id === id) resetForm();
      await loadUsers();
    } catch (e) {
      setError(e.message || 'Failed to delete user');
    }
  }

  return (
    <div className="user-accounts-section">
      <h3 className="user-accounts-title">User Accounts</h3>

      {error && <div className="user-accounts-error">{error}</div>}
      {success && <div className="user-accounts-success">{success}</div>}

      <div className="user-accounts-layout">
        <div className="user-accounts-left">
          <div className="user-accounts-card">
            <h4 className="user-accounts-card-title">
              {mode === 'edit' ? 'Edit User' : 'Create User'}
            </h4>

            <div className="user-accounts-form">
              <div className="form-row">
                <label>Username</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="e.g. it23750210"
                />
              </div>

              <div className="form-row">
                <label>Identity Number</label>
                <input
                  value={form.identityNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, identityNumber: e.target.value }))
                  }
                  placeholder="e.g. IT23575776"
                />
              </div>

              <div className="form-row">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="name@sliit.lk"
                />
              </div>

              <div className="form-row">
                <label>
                  Password {mode === 'edit' ? '(optional)' : ''}
                </label>
                <input
                  value={form.password}
                  type="password"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder={
                    mode === 'edit' ? 'Leave empty to keep current' : 'Set a password'
                  }
                />
              </div>

              <div className="form-row">
                <label>Role</label>
                <select value={form.role} onChange={(e) => onChangeRole(e.target.value)}>
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!form.isApproved}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, isApproved: e.target.checked }))
                    }
                  />
                  Approved
                </label>
              </div>

              <div className="form-actions">
                {mode === 'edit' ? (
                  <>
                    <button className="user-accounts-primary-btn" onClick={updateUser}>
                      Update
                    </button>
                    <button className="user-accounts-secondary-btn" onClick={resetForm}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="user-accounts-primary-btn" onClick={createUser}>
                    Create
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="user-accounts-card user-accounts-details">
            <h4 className="user-accounts-card-title">User Details</h4>
            {!selectedUser ? (
              <div className="muted-text">
                Select “View” or “Edit” from the table.
              </div>
            ) : (
              <div className="details-grid">
                <div>
                  <strong>ID:</strong> {selectedUser.id}
                </div>
                <div>
                  <strong>Username:</strong> {selectedUser.username}
                </div>
                <div>
                  <strong>Email:</strong> {selectedUser.email}
                </div>
                <div>
                  <strong>Identity Number:</strong> {selectedUser.identityNumber}
                </div>
                <div>
                  <strong>Role:</strong> {selectedUser.role}
                </div>
                <div>
                  <strong>Approved:</strong> {selectedUser.isApproved ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Created:</strong>{' '}
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString()
                    : '-'}
                </div>
                <div>
                  <strong>Approved At:</strong>{' '}
                  {selectedUser.approvedAt
                    ? new Date(selectedUser.approvedAt).toLocaleString()
                    : '-'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="user-accounts-right">
          <div className="user-accounts-card">
            <h4 className="user-accounts-card-title">All Users</h4>

            {loading ? (
              <div className="user-accounts-loading">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="muted-text">No users found.</div>
            ) : (
              <div className="user-table-wrap">
                <table className="user-accounts-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Approved</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.username}</td>
                        <td>{u.role}</td>
                        <td>{u.isApproved ? 'Yes' : 'No'}</td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="user-accounts-view-btn"
                              onClick={() => setSelectedUser(u)}
                            >
                              View
                            </button>
                            <button
                              className="user-accounts-edit-btn"
                              onClick={() => startEdit(u)}
                            >
                              Edit
                            </button>
                            <button
                              className="user-accounts-delete-btn"
                              onClick={() => deleteUser(u.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

