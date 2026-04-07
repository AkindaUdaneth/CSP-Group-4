import React, { useState } from 'react';
import { adminService } from '../services/adminService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/AdminDashboard.css'; // Re-using your existing styles

const AttendanceReport = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            setError("Please select both a start and end date.");
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await adminService.getAttendanceReport(startDate, endDate);
            
            // Your backend returns { success: true, message: "...", data: [...] }
            if (response.success && response.data) {
                setReportData(response.data);
            } else {
                setError("No data returned from the server.");
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

const handleExportPDF = () => {
        // 1. Create a new PDF document (portrait, points, A4 size)
        const doc = new jsPDF('p', 'pt', 'a4');

        // 2. Add a Title and Date Range
        doc.setFontSize(18);
        doc.text("SLIIT Tennis - Player Attendance Report", 40, 40);
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Date Range: ${startDate} to ${endDate}`, 40, 60);

        // 3. Format the data for the AutoTable plugin
        const tableColumn = ["Player Name", "Identity Number", "Scheduled", "Attended", "Attendance %"];
        const tableRows = [];

        reportData.forEach(player => {
            const playerData = [
                player.playerName,
                player.identityNumber,
                player.totalSessionsScheduled,
                player.sessionsAttended,
                `${player.attendancePercentage}%`
            ];
            tableRows.push(playerData);
        });

        // 4. Generate the Table
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 80, // Start below the title
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 5 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // A nice professional blue
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        // 5. Save the file
        const timestamp = new Date().toISOString().split('T')[0];
        doc.save(`Attendance_Report_${timestamp}.pdf`);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-2xl font-bold mb-4">Player Attendance Report</h2>
            
            <div className="flex flex-wrap gap-4 mb-6 items-end">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold mb-1">Start Date</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border p-2 rounded"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold mb-1">End Date</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border p-2 rounded"
                    />
                </div>
                
                {/* --- THIS IS WHERE YOU REPLACE THE OLD BUTTON --- */}
                <div className="flex gap-2">
                    <button 
                        onClick={handleGenerateReport}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                    
                    {/* ONLY show export button if we actually have data */}
                    {reportData.length > 0 && (
                        <button 
                            onClick={handleExportPDF}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                        >
                            Export to PDF
                        </button>
                    )}
                </div>
                {/* ------------------------------------------------ */}

            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {reportData.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-3">Player Name</th>
                                <th className="p-3">Identity Number</th>
                                <th className="p-3 text-center">Sessions Scheduled</th>
                                <th className="p-3 text-center">Sessions Attended</th>
                                <th className="p-3 text-center">Attendance %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((player) => (
                                <tr key={player.playerId} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{player.playerName}</td>
                                    <td className="p-3">{player.identityNumber}</td>
                                    <td className="p-3 text-center">{player.totalSessionsScheduled}</td>
                                    <td className="p-3 text-center">{player.sessionsAttended}</td>
                                    <td className={`p-3 text-center font-bold ${
                                        player.attendancePercentage < 50 ? 'text-red-500' : 'text-green-600'
                                    }`}>
                                        {player.attendancePercentage}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                !loading && <p className="text-gray-500 italic">Select dates and generate a report to view data.</p>
            )}
        </div>
    );
};

export default AttendanceReport;