'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Download,
} from 'lucide-react';

export default function StaffAttendancePage() {
  const { data: session } = useSession();
  const [policy, setPolicy] = useState<any>(null);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    fetchPolicy();
    fetchTodayLog();
    fetchRecentLogs();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  };

  const fetchPolicy = async () => {
    try {
      const response = await fetch('/api/attendance/policy?activeOnly=true');
      const data = await response.json();
      if (response.ok && data.policies.length > 0) {
        setPolicy(data.policies[0]);
      }
    } catch (error) {
      console.error('Error fetching policy:', error);
    }
  };

  const fetchTodayLog = async () => {
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      const response = await fetch(
        `/api/attendance/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();

      if (response.ok && data.logs.length > 0) {
        setTodayLog(data.logs[0]);
      }
    } catch (error) {
      console.error('Error fetching today log:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await fetch(
        `/api/attendance/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();

      if (response.ok) {
        setRecentLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    }
  };

  const handleClockAction = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    if (!location && policy?.requireLocationVerification) {
      alert('Please enable location services to clock in/out');
      return;
    }

    setClockingIn(true);
    try {
      // Get device info
      const deviceInfo = {
        type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        browser: navigator.userAgent,
        os: navigator.platform,
      };

      const response = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          location: location
            ? {
                ...location,
                timestamp: new Date().toISOString(),
              }
            : null,
          deviceInfo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchTodayLog();
        fetchRecentLogs();
      } else {
        alert(data.error || 'Failed to clock ' + action.toLowerCase().replace('_', ' '));
      }
    } catch (error) {
      alert('Error processing clock action');
    } finally {
      setClockingIn(false);
    }
  };

  const handleManualEntry = async () => {
    const logDate = prompt('Enter date (YYYY-MM-DD):');
    if (!logDate) return;

    const reason = prompt(
      'Enter reason (ABSENT/LATE/PERMISSION/ON_ASSIGNMENT/FORGOT_TO_CLOCK/SYSTEM_ERROR):'
    );
    if (!reason) return;

    const description = prompt('Enter description:');

    try {
      const response = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate,
          reason: reason.toUpperCase(),
          description,
          location,
          deviceInfo: {
            type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            browser: navigator.userAgent,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchRecentLogs();
      } else {
        alert(data.error || 'Failed to submit manual entry');
      }
    } catch (error) {
      alert('Error submitting manual entry');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      PRESENT: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md">
          ✓ Present
        </span>
      ),
      LATE: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md">
          ⏰ Late
        </span>
      ),
      ABSENT: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-md">
          ✗ Absent
        </span>
      ),
      ON_LEAVE: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md">
          🏖️ On Leave
        </span>
      ),
      ON_ASSIGNMENT: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-md">
          📋 On Assignment
        </span>
      ),
      HALF_DAY: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md">
          ⏱️ Half Day
        </span>
      ),
      EXCUSED: (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-md">
          ✓ Excused
        </span>
      ),
    };

    return badges[status] || (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-md">
        {status}
      </span>
    );
  };

  const isWithinTimeFrame = () => {
    if (!policy) return false;

    const now = new Date();
    const [startHour, startMinute] = policy.workStartTime.split(':').map(Number);
    const [endHour, endMinute] = policy.workEndTime.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMinute - policy.clockInGracePeriod;
    const endMinutes = endHour * 60 + endMinute + policy.clockOutGracePeriod;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const canClockIn = todayLog?.actualClockIn ? false : isWithinTimeFrame();
  const canClockOut = todayLog?.actualClockIn && !todayLog?.actualClockOut;

  const stats = {
    present: recentLogs.filter((log) => ['PRESENT', 'LATE'].includes(log.status)).length,
    late: recentLogs.filter((log) => log.isLate).length,
    totalHours: recentLogs.reduce((sum, log) => sum + (log.totalWorkHours || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              My Attendance
            </h2>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Track your work hours and attendance records
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-2xl">
            <Calendar className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Current Status & Actions */}
        <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1">
            <div className="bg-white rounded-t-xl">
              <CardBody>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Today's Status */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Status</h3>
              {loading ? (
                <p className="text-gray-600">Loading...</p>
              ) : todayLog ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                        Status
                      </span>
                      {getStatusBadge(todayLog.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {todayLog.actualClockIn && (
                        <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Clock In</p>
                          <p className="font-bold text-green-700 text-lg">
                            {new Date(todayLog.actualClockIn).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                      {todayLog.actualClockOut && (
                        <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Clock Out</p>
                          <p className="font-bold text-red-700 text-lg">
                            {new Date(todayLog.actualClockOut).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {todayLog.totalWorkHours && (
                      <div className="mt-3 bg-gradient-to-r from-emerald-100 to-green-100 p-3 rounded-lg border border-emerald-300">
                        <p className="text-xs text-emerald-700 mb-1">Total Work Hours</p>
                        <p className="font-bold text-emerald-800 text-2xl flex items-center gap-2">
                          ⏱️ {todayLog.totalWorkHours.toFixed(2)} hours
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No attendance record for today yet</p>
                  <p className="text-xs text-gray-400 mt-1">Clock in to start tracking your hours</p>
                </div>
              )}
            </div>

            {/* Clock Actions */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Clock Actions</h3>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 mb-3">
                    {todayLog?.actualClockIn && !todayLog?.actualClockOut
                      ? 'You are currently clocked in'
                      : todayLog?.actualClockOut
                      ? 'You have completed your workday'
                      : 'Ready to start your workday'}
                  </p>
                  
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleClockAction('CLOCK_IN')}
                      disabled={!canClockIn || clockingIn}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      size="lg"
                    >
                      <Clock className="w-5 h-5 mr-2" />
                      {clockingIn ? 'Processing...' : 'Clock In'}
                    </Button>

                    <Button
                      onClick={() => handleClockAction('CLOCK_OUT')}
                      disabled={!canClockOut || clockingIn}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                      size="lg"
                    >
                      <Clock className="w-5 h-5 mr-2" />
                      {clockingIn ? 'Processing...' : 'Clock Out'}
                    </Button>
                  </div>
                </div>

                {policy?.allowManualLogs && (
                  <Button
                    onClick={handleManualEntry}
                    variant="outline"
                    className="w-full border-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                    size="sm"
                  >
                    📝 Submit Manual Entry
                  </Button>
                )}

                {!isWithinTimeFrame() && !todayLog?.actualClockOut && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                    <p className="text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Outside regular work hours. Contact HR or use manual entry if needed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
              </CardBody>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-transform">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Days Present</p>
                  <p className="text-4xl font-bold">{stats.present}</p>
                  <p className="text-xs opacity-75 mt-1">Last 30 days</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                  <CheckCircle className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-transform">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Late Days</p>
                  <p className="text-4xl font-bold">{stats.late}</p>
                  <p className="text-xs opacity-75 mt-1">Last 30 days</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-transform">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Total Hours</p>
                  <p className="text-4xl font-bold">{stats.totalHours.toFixed(1)}</p>
                  <p className="text-xs opacity-75 mt-1">Last 30 days</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                  <TrendingUp className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recent Logs */}
        <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 border-b-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Recent Attendance History
            </h3>
            <p className="text-sm text-gray-600 mt-1">Your attendance records for the last 30 days</p>
          </CardHeader>
          <CardBody>
            {recentLogs.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No attendance records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 uppercase tracking-wider">
                        Clock In
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 uppercase tracking-wider">
                        Clock Out
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentLogs.slice(0, 15).map((log, index) => (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          📅 {new Date(log.logDate).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.actualClockIn ? (
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              {new Date(log.actualClockIn).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {log.actualClockOut ? (
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              {new Date(log.actualClockOut).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {log.totalWorkHours ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700">
                              ⏱️ {log.totalWorkHours.toFixed(2)} hrs
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
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
