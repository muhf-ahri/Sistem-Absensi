import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/API';
import { Clock, Calendar, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayAttendance: null,
    monthlyPresent: 0,
    monthlyAbsent: 0,
    leaveRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get today's attendance
      const todayResponse = await api.get(`/attendance/today/${user.id}`);
      
      // Get attendance history for this month
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        .toISOString().split('T')[0];
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        .toISOString().split('T')[0];
      
      const historyResponse = await api.get(`/attendance/history/${user.id}?startDate=${firstDay}&endDate=${lastDay}`);
      
      // Get leave stats
      const leaveResponse = await api.get(`/leaves/stats/${user.id}`);

      const attendanceHistory = historyResponse.data;
      const presentDays = attendanceHistory.filter(record => record.checkIn).length;
      const totalWorkingDays = new Date().getDate(); // Approximate

      setStats({
        todayAttendance: todayResponse.data,
        monthlyPresent: presentDays,
        monthlyAbsent: totalWorkingDays - presentDays,
        leaveRequests: leaveResponse.data.pending || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Karyawan</h2>
        <p className="text-gray-600">Ringkasan aktivitas dan statistik Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Status */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status Hari Ini</p>
              <p className={`text-2xl font-bold mt-2 ${
                stats.todayAttendance?.checkIn 
                  ? (stats.todayAttendance?.checkOut ? 'text-green-600' : 'text-blue-600')
                  : 'text-red-600'
              }`}>
                {stats.todayAttendance?.checkIn 
                  ? (stats.todayAttendance?.checkOut ? 'Completed' : 'Checked In')
                  : 'Not Checked In'
                }
              </p>
            </div>
            <div className={`p-3 rounded-xl ${
              stats.todayAttendance?.checkIn 
                ? (stats.todayAttendance?.checkOut ? 'bg-green-100' : 'bg-blue-100')
                : 'bg-red-100'
            }`}>
              {stats.todayAttendance?.checkIn ? (
                stats.todayAttendance?.checkOut ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-blue-600" />
                )
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Monthly Present */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hadir (Bulan Ini)</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {stats.monthlyPresent} hari
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Monthly Absent */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tidak Hadir</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {stats.monthlyAbsent} hari
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cuti Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {stats.leaveRequests}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-100">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Timeline */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Hari Ini</h3>
          <div className="space-y-4">
            {stats.todayAttendance?.checkIn ? (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    <span className="text-blue-700 font-medium">Check-in</span>
                  </div>
                  <span className="text-blue-600">
                    {new Date(stats.todayAttendance.checkIn.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {stats.todayAttendance.checkOut && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                      <span className="text-green-700 font-medium">Check-out</span>
                    </div>
                    <span className="text-green-600">
                      {new Date(stats.todayAttendance.checkOut.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Belum ada aktivitas hari ini</p>
                <p className="text-sm">Lakukan check-in untuk memulai</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Kehadiran</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rate Kehadiran</span>
              <span className="font-semibold text-green-600">
                {Math.round((stats.monthlyPresent / (stats.monthlyPresent + stats.monthlyAbsent)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(stats.monthlyPresent / (stats.monthlyPresent + stats.monthlyAbsent)) * 100}%` 
                }}
              ></div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span>Terus pertahankan konsistensi Anda!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;