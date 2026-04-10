import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { API_ENDPOINTS } from '../config/api';
import '../styles/AdminDashboard.css';

const HEALTH_API_URL = API_ENDPOINTS.ADMIN.replace('/admin', '/health');

const SystemStatus = () => {
    const [healthData, setHealthData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastChecked, setLastChecked] = useState(new Date());

    // 1. Fetch real-time status
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

    // 2. Fetch the 24-hour SLA History
    const fetchHistory = async () => {
        try {
            const response = await fetch(`${HEALTH_API_URL}/history`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    // Format data for Recharts: UP = 1, DOWN = 0
                    const formattedData = data.data.map(log => ({
                        time: new Date(log.pingedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        fullDate: new Date(log.pingedAt).toLocaleString(),
                        statusValue: log.status === 'Healthy' ? 1 : 0,
                        rawStatus: log.status
                    }));
                    setHistoryData(formattedData);
                }
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        }
    };

    // 3. Trigger both fetches on load
    useEffect(() => {
        const loadAllData = async () => {
            await fetchHealth();
            await fetchHistory();
        };
        
        loadAllData();
        // Auto-refresh every 60 seconds
        const interval = setInterval(loadAllData, 60000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const isHealthy = healthData?.status === "Healthy";

    // Custom Tooltip for the Recharts graph
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return React.createElement('div', { style: { background: 'white', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' } },
                React.createElement('p', { style: { margin: '0 0 4px 0', fontWeight: 'bold', color: data.statusValue === 1 ? '#10b981' : '#ef4444' } }, `Status: ${data.rawStatus}`),
                React.createElement('p', { style: { margin: 0, fontSize: '12px', color: '#6b7280' } }, data.fullDate)
            );
        }
        return null;
    };

    return React.createElement('div', { className: 'approvals-tab' },
        // --- HEADER ---
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
            React.createElement('h2', { style: { margin: 0 } }, 'System Status'),
            React.createElement('button', {
                onClick: () => { fetchHealth(); fetchHistory(); },
                className: 'approve-btn',
                style: { display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6', padding: '8px 16px' },
                disabled: loading
            },
                React.createElement(RefreshCw, { size: 16, className: loading ? "spin-animation" : "" }),
                loading ? 'Checking...' : 'Refresh'
            )
        ),

        // --- ERROR ALERT ---
        error && !healthData && React.createElement('div', { className: 'error-message', style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            React.createElement(AlertTriangle, { size: 20 }),
            'Cannot reach the server. The backend API might be completely offline.'
        ),

        // --- KPI CARDS ---
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
        ),

        // --- NEW UPTIME GRAPH (RECHARTS) ---
        React.createElement('div', { style: { marginTop: '24px', background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
                React.createElement(Activity, { size: 20, color: '#374151' }),
                React.createElement('h3', { style: { margin: 0, color: '#374151' } }, '24-Hour Uptime History')
            ),
            React.createElement('div', { style: { height: '300px', width: '100%' } },
                historyData.length > 0 
                    ? React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
                        React.createElement(AreaChart, { data: historyData, margin: { top: 10, right: 30, left: 0, bottom: 0 } },
                            React.createElement(CartesianGrid, { strokeDasharray: '3 3', vertical: false, stroke: '#e5e7eb' }),
                            React.createElement(XAxis, { dataKey: 'time', tick: { fontSize: 12, fill: '#6b7280' }, minTickGap: 30, tickMargin: 10 }),
                            React.createElement(YAxis, { 
                                domain: [0, 1], 
                                ticks: [0, 1], 
                                tickFormatter: (val) => val === 1 ? 'UP' : 'DOWN', 
                                tick: { fontSize: 12, fill: '#6b7280' },
                                width: 50
                            }),
                            React.createElement(Tooltip, { content: React.createElement(CustomTooltip) }),
                            // type="stepAfter" creates that blocky Server SLA look instead of a curved line
                            React.createElement(Area, { type: 'stepAfter', dataKey: 'statusValue', stroke: '#10b981', fill: '#ecfdf5', strokeWidth: 2 })
                        )
                    ) 
                    : React.createElement('div', { style: { display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontStyle: 'italic' } }, 
                        'Waiting for background service to collect initial data. Check back in 15 minutes.'
                    )
            )
        )
    );
};

export default SystemStatus;