import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TournamentManagement from '../components/TournamentManagement';
import TournamentCalendar from '../components/TournamentCalendar';
import TournamentBracket from '../components/TournamentBracket';
import LiveScoring from './LiveScoring';
import InventoryPage from './InventoryPage';
import PracticeSessionManagement from '../components/PracticeSessionManagement';
import AdminAttendanceManagement from '../components/AdminAttendanceManagement';
import AttendanceReport from '../components/AttendanceReport';
import SystemStatus from '../components/SystemStatus';
import InnerNavbar from '../components/InnerNavbar';

import { API_ENDPOINTS } from '../config/api';
import '../styles/AdminDashboard.css';

const API_URL = API_ENDPOINTS.ADMIN;

function isAdminRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'systemadmin';
}

export default function AdminDashboard() {

  const navigate = useNavigate();
  const auth = useAuth();

  const username = auth.user?.username || '';
  const role = auth.user?.role;

  const [activeTab, setActiveTabRaw] = useState(
    () => sessionStorage.getItem('adminActiveTab') || 'tournaments'
  );
  const setActiveTab = (tab) => {
    sessionStorage.setItem('adminActiveTab', tab);
    setActiveTabRaw(tab);
  };
  const [pendingRequests, setPendingRequests] = useState([]);
  
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerForm, setPlayerForm] = useState({
    username: '', email: '', identityNumber: '', contactNumber: '',
    address: '', role: 3, isApproved: true, newPassword: ''
  });
  const [playersError, setPlayersError] = useState('');
  const [playersSuccess, setPlayersSuccess] = useState('');
  const [savingPlayer, setSavingPlayer] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tournamentRefresh, setTournamentRefresh] = useState(0);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.isAuthenticated) {
      navigate('/');
      return;
    }
    if (!isAdminRole(role)) {
      navigate('/dashboard');
      return;
    }
    loadPending();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.isAuthenticated, role]);

  async function loadPending() {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(API_URL + '/pending-approvals', {
        headers: {
          'Authorization': 'Bearer ' + auth.token,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to load pending requests');
      const data = await response.json();
      setPendingRequests(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayers() {
    try {
      setPlayersLoading(true);
      setPlayersError('');
      const response = await fetch(API_URL + '/users?role=Player', {
        headers: {
          'Authorization': 'Bearer ' + auth.token,
          'Content-Type': 'application/json'
        }
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData.message || 'Failed to load players');
      setPlayers(responseData.data || []);
    } catch (err) {
      setPlayersError(err.message || 'Failed to load players');
    } finally {
      setPlayersLoading(false);
    }
  }

  async function openPlayerDetails(playerId) {
    try {
      setPlayersError('');
      setPlayersSuccess('');
      const response = await fetch(API_URL + '/users/' + playerId, {
        headers: {
          'Authorization': 'Bearer ' + auth.token,
          'Content-Type': 'application/json'
        }
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData.message || 'Failed to load player details');
      const player = responseData.data;
      setSelectedPlayerId(playerId);
      setSelectedPlayer(player);
      setPlayerForm({
        username: player.username || '', email: player.email || '',
        identityNumber: player.identityNumber || '', contactNumber: player.contactNumber || '',
        address: player.address || '', role: Number(player.role) || 3,
        isApproved: !!player.isApproved, newPassword: ''
      });
    } catch (err) {
      setPlayersError(err.message || 'Failed to load player details');
    }
  }

  function handlePlayerFormChange(event) {
    const { name, value, type, checked } = event.target;
    setPlayerForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'role' ? Number(value) : value)
    }));
  }

  async function savePlayerChanges() {
    if (!selectedPlayerId) return;
    try {
      setSavingPlayer(true);
      setPlayersError('');
      setPlayersSuccess('');
      const payload = {
        username: playerForm.username.trim(), email: playerForm.email.trim(),
        identityNumber: playerForm.identityNumber.trim(), contactNumber: playerForm.contactNumber.trim(),
        address: playerForm.address.trim(), role: playerForm.role,
        isApproved: playerForm.isApproved, newPassword: playerForm.newPassword.trim()
      };
      const response = await fetch(API_URL + '/users/' + selectedPlayerId, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + auth.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData.message || 'Failed to save player details');
      setPlayersSuccess(responseData.message || 'Player details updated successfully');
      if (responseData.data) setSelectedPlayer(responseData.data);
      setPlayerForm(prev => ({ ...prev, newPassword: '' }));
      loadPlayers();
    } catch (err) {
      setPlayersError(err.message || 'Failed to save player details');
    } finally {
      setSavingPlayer(false);
    }
  }

  async function approve(id, username) {
    if (!window.confirm(`Approve registration for ${username}?`)) return;
    try {
      setError(''); setSuccessMessage('');
      const response = await fetch(API_URL + '/approve-player/' + id, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + auth.token, 'Content-Type': 'application/json' }
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData.message || 'Failed to approve registration');
      setSuccessMessage(`Successfully approved ${username}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadPending();
    } catch (err) {
      setError(err.message || 'Failed to approve registration');
      setTimeout(() => setError(''), 5000);
    }
  }

  async function reject(id, username) {
    const reason = window.prompt(`Reject registration for ${username}? Enter reason (optional):`);
    if (reason === null) return;
    try {
      setError(''); setSuccessMessage('');
      const response = await fetch(API_URL + '/reject-player/' + id, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + auth.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'No reason provided' })
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData.message || 'Failed to reject registration');
      setSuccessMessage(`Successfully rejected ${username}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadPending();
    } catch (err) {
      setError(err.message || 'Failed to reject registration');
      setTimeout(() => setError(''), 5000);
    }
  }

  function handleLogout() {
    auth.logout();
    navigate('/');
  }

  function handleTournamentAdded() {
    setTournamentRefresh(prev => prev + 1);
  }

  /* ── Nav items for secondary bar ── */
  const navItems = [
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'bracket', label: 'Bracket' },
    { id: 'live-scoring', label: 'Live Score' },
    { id: 'practice', label: 'Practice' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'players', label: 'Players' },
    { id: 'status', label: 'Settings' },
    { id: 'reports', label: 'Reports' },
  ];

  return React.createElement(
    'div',
    { className: 'admin-dashboard-container' },

    /* ── Top Navbar ── */
    React.createElement(InnerNavbar, {
      title: 'Admin Panel',
      username: username,
      backTo: '/',
      onLogout: handleLogout
    }),

    /* ── Secondary Navigation Bar ── */
    React.createElement('div', { className: 'admin-subnav' },
      React.createElement('div', { className: 'admin-subnav__inner' },
        navItems.map(function(item) {
          return React.createElement('button', {
            key: item.id,
            className: 'admin-subnav__item' + (activeTab === item.id ? ' admin-subnav__item--active' : ''),
            onClick: function() {
              setActiveTab(item.id);
              if (item.id === 'players') loadPlayers();
            }
          },
            React.createElement('span', { className: 'admin-subnav__label' }, item.label)
          );
        })
      )
    ),

    /* ── Page Content ── */
    React.createElement('div', { className: 'admin-page-content' },

      activeTab === 'tournaments' && React.createElement(TournamentManagement, { token: auth.token, onTournamentAdded: handleTournamentAdded, key: 'tab-tournaments' }),
      activeTab === 'calendar' && React.createElement(TournamentCalendar, { token: auth.token, refreshTrigger: tournamentRefresh, key: 'tab-calendar' }),
      activeTab === 'bracket' && React.createElement(TournamentBracket, { token: auth.token, key: 'tab-bracket', onOpenLiveScoring: function() { setActiveTab('live-scoring'); } }),
      activeTab === 'live-scoring' && React.createElement(LiveScoring, { key: 'tab-live-scoring' }),
      activeTab === 'inventory' && React.createElement(InventoryPage, { isAdmin: true, userId: auth.user?.id, key: 'tab-inventory' }),
      activeTab === 'practice' && React.createElement(PracticeSessionManagement, { token: auth.token, key: 'tab-practice' }),
      activeTab === 'attendance' && React.createElement(AdminAttendanceManagement, { token: auth.token, key: 'tab-attendance' }),
      activeTab === 'reports' && React.createElement(AttendanceReport, { key: 'tab-reports' }),
      activeTab === 'status' && React.createElement(SystemStatus, { key: "tab-status" }),

      activeTab === 'players' && React.createElement('div', { className: 'admin-card', key: 'tab-players' },
        React.createElement('h2', { className: 'admin-card__title' }, 'Registered Players'),
        playersError && React.createElement('div', { className: 'error-message' }, playersError),
        playersSuccess && React.createElement('div', { className: 'success-message' }, playersSuccess),
        playersLoading
          ? React.createElement('div', { className: 'loading' }, 'Loading players...')
          : React.createElement('div', { className: 'players-management-grid' },
            React.createElement('div', { className: 'requests-table scrollable' },
              React.createElement('table', null,
                React.createElement('thead', null,
                  React.createElement('tr', null,
                    React.createElement('th', null, 'Username'),
                    React.createElement('th', null, 'Email'),
                    React.createElement('th', null, 'Identity Number'),
                    React.createElement('th', null, 'Status')
                  )
                ),
                React.createElement('tbody', null,
                  (players || []).map(function(player) {
                    return React.createElement('tr', {
                      key: player.id,
                      onClick: function() { openPlayerDetails(player.id); },
                      className: selectedPlayerId === player.id ? 'selected-row' : ''
                    },
                      React.createElement('td', null, player.username),
                      React.createElement('td', null, player.email),
                      React.createElement('td', null, player.identityNumber),
                      React.createElement('td', null, player.isApproved ? 'Approved' : 'Pending')
                    );
                  })
                )
              )
            ),
            React.createElement('div', { className: 'player-details-card' },
              !selectedPlayer
                ? React.createElement('p', null, 'Select a player to view and edit full details.')
                : React.createElement('div', null,
                  React.createElement('h3', null, 'Edit Player #' + selectedPlayer.id),
                  React.createElement('div', { className: 'player-form-grid' },
                    React.createElement('label', null, 'Username'),
                    React.createElement('input', { name: 'username', value: playerForm.username, onChange: handlePlayerFormChange }),
                    React.createElement('label', null, 'Email'),
                    React.createElement('input', { name: 'email', value: playerForm.email, onChange: handlePlayerFormChange }),
                    React.createElement('label', null, 'Identity Number'),
                    React.createElement('input', { name: 'identityNumber', value: playerForm.identityNumber, onChange: handlePlayerFormChange }),
                    React.createElement('label', null, 'Contact Number'),
                    React.createElement('input', { name: 'contactNumber', value: playerForm.contactNumber, onChange: handlePlayerFormChange }),
                    React.createElement('label', null, 'Address'),
                    React.createElement('textarea', { name: 'address', value: playerForm.address, onChange: handlePlayerFormChange, rows: 3 }),
                    React.createElement('label', null, 'Role'),
                    React.createElement('select', { name: 'role', value: playerForm.role, onChange: handlePlayerFormChange }, [
                      React.createElement('option', { key: 'role-1', value: 1 }, 'SystemAdmin'),
                      React.createElement('option', { key: 'role-2', value: 2 }, 'Admin'),
                      React.createElement('option', { key: 'role-3', value: 3 }, 'Player'),
                      React.createElement('option', { key: 'role-4', value: 4 }, 'PendingPlayer')
                    ]),
                    React.createElement('label', null, 'Reset Password (optional)'),
                    React.createElement('input', { name: 'newPassword', value: playerForm.newPassword, onChange: handlePlayerFormChange, placeholder: 'Leave blank to keep current password' }),
                    React.createElement('label', { className: 'checkbox-row' },
                      React.createElement('input', { type: 'checkbox', name: 'isApproved', checked: playerForm.isApproved, onChange: handlePlayerFormChange }),
                      ' Approved'
                    ),
                    React.createElement('div', { className: 'readonly-meta' },
                      React.createElement('strong', null, 'Created: '),
                      selectedPlayer.createdAt ? new Date(selectedPlayer.createdAt).toLocaleString() : '-'
                    ),
                    React.createElement('div', { className: 'readonly-meta' },
                      React.createElement('strong', null, 'Approved At: '),
                      selectedPlayer.approvedAt ? new Date(selectedPlayer.approvedAt).toLocaleString() : '-'
                    ),
                    React.createElement('button', { className: 'approve-btn', onClick: savePlayerChanges, disabled: savingPlayer },
                      savingPlayer ? 'Saving...' : 'Save Player Details'
                    )
                  )
                )
            )
          )
      ),

      activeTab === 'approvals' && React.createElement('div', { className: 'admin-card', key: 'tab-approvals' },
        React.createElement('h2', { className: 'admin-card__title' }, 'Pending Registration Requests'),
        error && React.createElement('div', { className: 'error-message' }, error),
        successMessage && React.createElement('div', { className: 'success-message' }, successMessage),
        loading
          ? React.createElement('div', { className: 'loading' }, 'Loading...')
          : pendingRequests.length === 0
            ? React.createElement('div', { className: 'no-requests' }, React.createElement('p', null, 'No pending registration requests'))
            : React.createElement('div', { className: 'requests-table scrollable' },
                React.createElement('table', null,
                  React.createElement('thead', null,
                    React.createElement('tr', null,
                      React.createElement('th', null, 'Username'),
                      React.createElement('th', null, 'Identity Number'),
                      React.createElement('th', null, 'Email'),
                      React.createElement('th', null, 'Requested Date'),
                      React.createElement('th', null, 'Actions')
                    )
                  ),
                  React.createElement('tbody', null,
                    pendingRequests.map(function(req) {
                      return React.createElement('tr', { key: req.id },
                        React.createElement('td', { style: { fontWeight: '700' } }, req.username),
                        React.createElement('td', null, req.identityNumber),
                        React.createElement('td', null, req.email),
                        React.createElement('td', null, new Date(req.createdAt).toLocaleDateString()),
                        React.createElement('td', null,
                          React.createElement('div', { className: 'actions-cell' },
                            React.createElement('button', { className: 'approve-btn', onClick: function() { approve(req.id, req.username); } }, 'Approve'),
                            React.createElement('button', { className: 'reject-btn', onClick: function() { reject(req.id, req.username); } }, 'Reject')
                          )
                        )
                      );
                    })
                  )
                )
              )
      )
    )
  );
}