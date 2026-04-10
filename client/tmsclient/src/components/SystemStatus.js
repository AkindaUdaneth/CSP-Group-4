import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import '../styles/AdminDashboard.css';

const HEALTH_API_URL = API_ENDPOINTS.ADMIN.replace('/admin', '/health');

const SystemStatus = () => {
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastChecked, setLastChecked] = useState(new Date());

    const fetchHealth = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(HEALTH_API_URL);
            const data = await response.json();
            
            if (!response.ok) {
                setHealthData(data);
                throw new Error("System is degraded or unhealthy.");
            }
            
            setHealthData(data);
        } catch (err) {
            console.error("Health check failed:", err);
            setError(err.message);
        } finally {
            setLastChecked(new Date());
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const isHealthy = healthData?.status === "Healthy";

    return React.createElement('div', { className: 'approvals-tab' },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
            React.createElement('h2', { style: { margin: 0 } }, 'System Status'),
            React.createElement('button', {
                onClick: fetchHealth,
                className: 'approve-btn',
                style: { display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6', padding: '8px 16px' },
                disabled: loading
            },
                React.createElement(RefreshCw, { size: 16, className: loading ? "spin-animation" : "" }),
                loading ? 'Checking...' : 'Refresh'
            )
        ),

        error && !healthData && React.createElement('div', { className: 'error-message', style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            React.createElement(AlertTriangle, { size: 20 }),
            'Cannot reach the server. The backend API might be completely offline.'
        ),

        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' } },
            
            // API Server Card
            React.createElement('div', { style: { background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280', marginBottom: '16px' } },
                    React.createElement(Server, { size: 20 }),
                    React.createElement('h3', { style: { margin: 0, fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' } }, 'API Server')
                ),
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                    React.createElement('div', { style: { width: '16px', height: '16px', borderRadius: '50%', background: isHealthy ? '#10b981' : '#ef4444', boxShadow: isHealthy ? '0 0 10px #10b981' : '0 0 10px #ef4444' } }),
                    React.createElement('span', { style: { fontSize: '24px', fontWeight: '700', color: '#111827' } }, healthData?.status || "Offline")
                )
            ),

            // Database Card
            React.createElement('div', { style: { background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280', marginBottom: '16px' } },
                    React.createElement(Database, { size: 20 }),
                    React.createElement('h3', { style: { margin: 0, fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' } }, 'Azure SQL Database')
                ),
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                    React.createElement('div', { style: { width: '16px', height: '16px', borderRadius: '50%', background: healthData?.database === "Connected" ? '#10b981' : '#ef4444' } }),
                    React.createElement('span', { style: { fontSize: '24px', fontWeight: '700', color: '#111827' } }, healthData?.database || "Disconnected")
                )
            ),

            // Timestamp Card
            React.createElement('div', { style: { background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280', marginBottom: '16px' } },
                    React.createElement(Clock, { size: 20 }),
                    React.createElement('h3', { style: { margin: 0, fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' } }, 'Last Pinged')
                ),
                React.createElement('div', { style: { fontSize: '24px', fontWeight: '700', color: '#111827' } }, formatTime(lastChecked)),
                healthData?.timestamp && React.createElement('div', { style: { fontSize: '12px', color: '#6b7280', marginTop: '8px' } }, `Server UTC: ${formatTime(healthData.timestamp)}`)
            )
        ),

        healthData?.message && React.createElement('div', { style: { marginTop: '24px', padding: '16px', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', borderRadius: '0 8px 8px 0' } },
            React.createElement('strong', null, 'Warning Details: '),
            healthData.message
        )
    );
};

export default SystemStatus;