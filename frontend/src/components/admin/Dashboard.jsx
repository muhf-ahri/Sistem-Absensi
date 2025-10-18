import React, { useState, useEffect } from 'react';
import { api } from '../../utils/API';
import { 
  Users, 
  CheckCircle, 
  FileText, 
  UserCheck,
  Clock,
  TrendingUp,
  BarChart3,
  MapPin
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayPresent: 0,
    todayAbsent: 0,
    pendingLeaves: 0,
    attendanceRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load employees
      const employeesResponse = await api.get('/users');
      const employees = employeesResponse.data.filter(emp => emp.role === 'employee');
      
      // Load today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceResponse = await api.get(`/attendance/all?startDate=${today}&endDate=${today}`);
      const todayAttendance = attendanceResponse.data;
      
      // Load all attendance for this month
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        .toISOString().split('T')[0];
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        .toISOString().split('T')[0];
      
      const monthlyAttendanceResponse = await api.get(`/attendance/all?startDate=${firstDay}&endDate=${lastDay}`);
      const monthlyAttendance = monthlyAttendanceResponse.data;
      
      // Load pending leaves
      const leavesResponse = await api.get('/leaves/all');
      const pendingLeaves = leavesResponse.data.filter(leave => leave.status === 'pending');

      const presentToday = todayAttendance.filter(record => record.checkIn).length;
      const attendanceRate = employees.length > 0 ? (presentToday / employees.length) * 100 : 0;

      // Calculate top performers
      const employeePerformance = employees.map(employee => {
        const employeeAttendances = monthlyAttendance.filter(record => record.userId === employee.id);
        const presentDays = employeeAttendances.filter(record => record.checkIn).length;
        const totalWorkingDays = new Date().getDate();
        const performanceRate = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;

        return {
          id: employee.id,
          name: employee.name,
          position: employee.position,
          presentDays,
          performanceRate: performanceRate
        };
      });

      const sortedPerformers = employeePerformance
        .sort((a, b) => b.performanceRate - a.performanceRate)
        .slice(0, 5);

      setStats({
        totalEmployees: employees.length,
        todayPresent: presentToday,
        todayAbsent: employees.length - presentToday,
        pendingLeaves: pendingLeaves.length,
        attendanceRate: attendanceRate
      });

      // Recent activity (last 10 attendance records)
      const allAttendanceResponse = await api.get('/attendance/all?limit=10');
      setRecentActivity(allAttendanceResponse.data.slice(0, 10));
      setTopPerformers(sortedPerformers);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Memuat dashboard..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-sm text-gray-600">Overview sistem absensi karyawan</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">Last updated:</span>
            <span className="font-medium text-gray-900">
              {new Date().toLocaleTimeString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Status */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Status Hari Ini</p>
              <p className={`text-lg font-bold mt-1 ${
                stats.todayPresent > 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {stats.todayPresent > 0 ? 'Active' : 'No Activity'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.todayPresent} dari {stats.totalEmployees} hadir
              </p>
            </div>
            <div className={`p-2.5 rounded-lg ${
              stats.todayPresent > 0 ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {stats.todayPresent > 0 ? (
                <UserCheck className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-gray-600" />
              )}
            </div>
          </div>
        </div>

        {/* Total Employees */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Karyawan</p>
              <p className="text-lg font-bold text-blue-600 mt-1">
                {stats.totalEmployees}
              </p>
              <p className="text-xs text-gray-500 mt-1">Aktif</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Hadir Hari Ini</p>
              <p className="text-lg font-bold text-green-600 mt-1">
                {stats.todayPresent}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.attendanceRate.toFixed(1)}% attendance
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Cuti Pending</p>
              <p className="text-lg font-bold text-yellow-600 mt-1">
                {stats.pendingLeaves}
              </p>
              <p className="text-xs text-gray-500 mt-1">Menunggu persetujuan</p>
            </div>
            <div className="p-2.5 rounded-lg bg-yellow-100">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Performance & Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Attendance Overview */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span>Overview Kehadiran</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{stats.totalEmployees}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{stats.todayPresent}</p>
                <p className="text-xs text-gray-600">Hadir</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-600">{stats.todayAbsent}</p>
                <p className="text-xs text-gray-600">Tidak Hadir</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{stats.attendanceRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Rate</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-green-600" />
              <span>Aktivitas Terbaru</span>
            </h3>
            <div className="space-y-2.5">
              {recentActivity.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Belum ada aktivitas hari ini</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        activity.checkIn ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.userName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {activity.userPosition} • {new Date(activity.date).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.checkIn ? 'Check-in' : 'Tidak Hadir'}
                      </p>
                      {activity.checkIn && (
                        <p className="text-xs text-gray-500">
                          {new Date(activity.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Top Performers */}
        <div className="space-y-4">
          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Top Performers</span>
            </h3>
            <div className="space-y-3">
              {topPerformers.length === 0 ? (
                <div className="text-center py-3 text-gray-500">
                  <p className="text-sm">Belum ada data performa</p>
                </div>
              ) : (
                topPerformers.map((employee, index) => (
                  <div key={employee.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {employee.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{employee.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {employee.performanceRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {employee.presentDays} hari
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;