'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Calendar,
  MapPin,
} from 'lucide-react';

export default function AdminAttendancePage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchPendingApprovals();
  }, []);

  const fetchLogs = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await fetch(
        `/api/attendance/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/attendance/logs?pendingApproval=true');
      const data = await response.json();

      if (response.ok) {
        setPendingApprovals(data.logs);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/attendance/logs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });

      if (response.ok) {
        alert('Manual entry approved');
        fetchLogs();
        fetchPendingApprovals();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve');
      }
    } catch (error) {
      alert('Error approving entry');
    }
  };

  const handleReject = async (id: string) => {
    const reviewNotes = prompt('Enter rejection reason:');
    if (!reviewNotes) return;

    try {
      const response = await fetch(`/api/attendance/logs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reviewNotes }),
      });

      if (response.ok) {
        alert('Manual entry rejected');
        fetchLogs();
        fetchPendingApprovals();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject');
      }
    } catch (error) {
      alert('Error rejecting entry');
    }
  };

  const generateReport = async () => {
    const startDate = prompt('Start date (YYYY-MM-DD):');
    const endDate = prompt('End date (YYYY-MM-DD):');

    if (!startDate || !endDate) return;

    try {
      const response = await fetch(
        `/api/attendance/reports?type=CUSTOM&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (response.ok) {
        alert('Report generated successfully!');
        console.log('Report:', data);
        // You can add download functionality here
      } else {
        alert(data.error || 'Failed to generate report');
      }
    } catch (error) {
      alert('Error generating report');
    }
  };

  const stats = {
    totalLogs: logs.length,
    present: logs.filter((l) => ['PRESENT', 'LATE'].includes(l.status)).length,
    late: logs.filter((l) => l.isLate).length,
    absent: logs.filter((l) => l.status === 'ABSENT').length,
    pendingApprovals: pendingApprovals.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
              Attendance Management
            </h2>
            <p className="text-gray-600 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Monitor and manage staff attendance records
            </p>
          </div>
          <Button 
            onClick={generateReport} 
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3"
          >
            <Download className="w-5 h-5" />
            Generate Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Total Logs (30d)</p>
                  <p className="text-4xl font-bold">{stats.totalLogs}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <Calendar className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Present</p>
                  <p className="text-4xl font-bold">{stats.present}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <CheckCircle className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Late</p>
                  <p className="text-4xl font-bold">{stats.late}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <Clock className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-rose-400 via-red-500 to-pink-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Absent</p>
                  <p className="text-4xl font-bold">{stats.absent}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <XCircle className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Pending</p>
                  <p className="text-4xl font-bold">{stats.pendingApprovals}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <AlertTriangle className="w-7 h-7" />
                Pending Manual Entry Approvals ({pendingApprovals.length})
              </h3>
            </CardHeader>
            <CardBody className="p-6">
              <div className="space-y-4">
                {pendingApprovals.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:border-amber-400 transition-all hover:shadow-lg"
                  >
                    <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold">{log.staff.name}</p>
                        <p className="text-sm text-gray-600">
                          {log.staff.staffId} - {log.staff.department}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <p>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(log.logDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Reason:</span> {log.manualEntryReason}
                      </p>
                      {log.manualEntryDescription && (
                        <p>
                          <span className="font-medium">Description:</span>{' '}
                          {log.manualEntryDescription}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(log.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(log.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Attendance Logs */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Recent Attendance Logs</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-center py-8">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No attendance logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Staff
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Clock In
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Clock Out
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Hours
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.slice(0, 20).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{log.staff.name}</p>
                          <p className="text-xs text-gray-500">{log.staff.staffId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(log.logDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.actualClockIn
                          ? new Date(log.actualClockIn).toLocaleTimeString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.actualClockOut
                          ? new Date(log.actualClockOut).toLocaleTimeString()
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {log.totalWorkHours ? `${log.totalWorkHours.toFixed(2)}h` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            log.status === 'PRESENT'
                              ? 'success'
                              : log.status === 'LATE'
                              ? 'warning'
                              : log.status === 'ABSENT'
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {log.locationVerified ? (
                          <Badge variant="success">
                            <MapPin className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            <MapPin className="w-3 h-3 mr-1" />
                            Not Verified
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
    </div>
  );
}
