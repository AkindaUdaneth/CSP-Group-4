import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import '../styles/AdminDashboard.css';

export default function AdminSystemHealth() {
  const navigate = useNavigate();
  const username = authService.getUsername();
  const role = localStorage.getItem('role');
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role !== 'Admin' && role !== 'SystemAdmin') {
      navigate('/dashboard');
      return;
    }

    let isCancelled = false;

    const fetchHealth = async () => {
      try {
        setError('');
        const data = await adminService.getSystemHealth();
        if (!isCancelled) {
          setHealth(data);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load system health');
          setLoading(false);
        }
      }
    };

    // initial fetch
    fetchHealth();

    // poll every 5 seconds for near real-time data
    const intervalId = setInterval(fetchHealth, 5000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [role, navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const statusClass =
    health?.status === 'Healthy'
      ? 'health-status-ok'
      : 'health-status-bad';

  const databaseCheck = health?.checks?.find(
    (c) =>
      c.name?.toLowerCase().includes('mysql') ||
      c.name?.toLowerCase().includes('db')
  );

  const memoryCheck = health?.checks?.find((c) =>
    c.name?.toLowerCase().includes('memory')
  );

  const toRunningLabel = (status) => {
    if (!status) return 'Unknown';
    if (status === 'Healthy') return 'Running';
    return status;
  };

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return 'Unknown';
    const s = Number(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${h}h ${m}m ${sec}s`;
  };

  return React.createElement(
    'div',
    { className: 'admin-dashboard-container' },
    React.createElement(
      'nav',
      { className: 'navbar' },
      React.createElement(
        'div',
        { className: 'nav-content' },
        React.createElement(
          'h1',
          null,
          'Admin Panel - System Health'
        ),
        React.createElement(
          'div',
          { className: 'nav-right' },
          React.createElement(
            'span',
            { className: 'welcome-text' },
            `Welcome, ${username} (${role})`
          ),
          React.createElement(
            'button',
            {
              onClick: () => navigate('/admin'),
              className: 'back-btn',
            },
            'Back to Admin'
          ),
          React.createElement(
            'button',
            { onClick: handleLogout, className: 'logout-btn' },
            'Logout'
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'admin-content' },
      React.createElement('h2', null, 'System Health'),
      error &&
        React.createElement(
          'div',
          { className: 'error-message' },
          error
        ),
      loading
        ? React.createElement(
            'div',
            { className: 'loading' },
            'Checking system health...'
          )
        : React.createElement(
            'div',
            { className: 'system-health-card' },
            React.createElement(
              'div',
              { className: `health-status ${statusClass}` },
              toRunningLabel(health?.status)
            ),
            React.createElement(
              'div',
              { className: 'health-details' },
              React.createElement(
                'p',
                null,
                React.createElement('strong', null, 'Backend: '),
                toRunningLabel(health?.status)
              ),
              React.createElement(
                'p',
                null,
                React.createElement('strong', null, 'Database: '),
                toRunningLabel(databaseCheck?.status)
              ),
              React.createElement(
                'p',
                null,
                React.createElement('strong', null, 'Memory: '),
                toRunningLabel(memoryCheck?.status)
              ),
              React.createElement(
                'p',
                null,
                React.createElement('strong', null, 'Uptime: '),
                formatUptime(health?.uptimeSeconds)
              )
            )
          )
    )
  );
}

