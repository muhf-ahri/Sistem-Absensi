import React, { useState, useEffect } from "react";
import { api } from "../../utils/API";
import { useSweetAlert } from "../../hooks/useSweetAlert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  UserCheck,
  UserX,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";

const Reports = () => {
  const [reportData, setReportData] = useState({
    attendance: [],
    summary: {},
    employeeStats: [],
  });
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Gunakan custom hook SweetAlert
  const {
    successToast,
    errorToast,
    warningToast,
    confirmation,
    successDialog,
    errorDialog,
    loading: showLoadingAlert,
    close: closeAlert,
  } = useSweetAlert();

  useEffect(() => {
    loadReportData();
    loadLeaveData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const loadingAlert = showLoadingAlert("Memuat data laporan...");

      // Load attendance data for the date range
      const attendanceResponse = await api.get(
        `/attendance/all?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      const employeesResponse = await api.get("/users");

      const attendanceData = attendanceResponse.data;
      const employees = employeesResponse.data.filter(
        (emp) => emp.role === "employee"
      );

      console.log("Attendance data:", attendanceData);
      console.log("Employees:", employees);

      // Calculate summary
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // Hitung total present berdasarkan checkIn yang valid
      const totalPresent = attendanceData.filter(
        (record) => record.checkIn && record.checkIn.timestamp
      ).length;

      // Employee statistics
      const employeeStats = employees.map((employee) => {
        const employeeAttendance = attendanceData.filter(
          (record) =>
            record.userId === employee._id || record.userId === employee.id
        );

        console.log(`Attendance for ${employee.name}:`, employeeAttendance);

        const presentDays = employeeAttendance.filter(
          (record) => record.checkIn && record.checkIn.timestamp
        ).length;

        const absentDays = totalDays - presentDays;
        const attendanceRate =
          totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        return {
          name: employee.name,
          present: presentDays,
          absent: absentDays,
          attendanceRate: attendanceRate,
          totalDays: totalDays,
        };
      });

      const totalEmployeeDays = employees.length * totalDays;
      const totalAbsent = totalEmployeeDays - totalPresent;
      const attendanceRate =
        totalEmployeeDays > 0 ? (totalPresent / totalEmployeeDays) * 100 : 0;

      // Daily attendance data for chart
      const dailyData = {};
      attendanceData.forEach((record) => {
        if (record.checkIn && record.checkIn.timestamp && record.date) {
          dailyData[record.date] = (dailyData[record.date] || 0) + 1;
        }
      });

      // Buat chart data untuk semua hari dalam range
      const chartData = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const present = dailyData[dateStr] || 0;
        const absent = employees.length - present;

        chartData.push({
          date: currentDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          }),
          present: present,
          absent: absent,
          fullDate: dateStr,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Sort by date
      chartData.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

      setReportData({
        attendance: chartData,
        summary: {
          totalEmployees: employees.length,
          totalPresent,
          totalAbsent,
          attendanceRate,
          dateRange: `${new Date(dateRange.startDate).toLocaleDateString(
            "id-ID"
          )} - ${new Date(dateRange.endDate).toLocaleDateString("id-ID")}`,
          totalDays: totalDays,
        },
        employeeStats,
      });

      closeAlert();
      successToast("Data laporan berhasil dimuat", 2000);
    } catch (error) {
      closeAlert();
      console.error("Error loading report data:", error);
      errorDialog(
        "Gagal Memuat Laporan",
        error.response?.data?.error || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveData = async () => {
    try {
      setLoadingLeave(true);
      const loadingAlert = showLoadingAlert("Memuat data cuti...");

      const response = await api.get("/leaves/all");
      console.log("Leave data loaded:", response.data);
      setLeaveData(response.data);

      closeAlert();

      if (response.data.length > 0) {
        const pendingCount = response.data.filter(
          (leave) => leave.status === "pending"
        ).length;
        if (pendingCount > 0) {
          successToast(
            `${pendingCount} pengajuan cuti menunggu persetujuan`,
            3000
          );
        }
      }
    } catch (error) {
      closeAlert();
      console.error("Error loading leave data:", error);
      errorToast("Gagal memuat data cuti");
    } finally {
      setLoadingLeave(false);
    }
  };

  // Helper function to get leave ID (handle both _id and id)
  const getLeaveId = (leave) => {
    return leave._id || leave.id;
  };

  const handleApproveLeave = async (leave) => {
    const leaveId = getLeaveId(leave);
    const userName = leave.userName || "Karyawan";

    if (!leaveId) {
      errorToast("ID cuti tidak valid");
      return;
    }

    const confirmationResult = await confirmation(
      "Setujui Pengajuan Cuti",
      `Apakah Anda yakin ingin menyetujui pengajuan cuti dari ${userName}?`,
      "Ya, Setujui"
    );

    if (!confirmationResult.isConfirmed) {
      return;
    }

    try {
      setLoadingLeave(true);
      const loadingAlert = showLoadingAlert("Menyetujui pengajuan cuti...");

      await api.put(`/leaves/${leaveId}/status`, {
        status: "approved",
        processedBy: null,
      });

      // Update local state
      setLeaveData((prev) =>
        prev.map((item) =>
          getLeaveId(item) === leaveId
            ? {
                ...item,
                status: "approved",
                processedAt: new Date().toISOString(),
                processedByName: "Admin",
              }
            : item
        )
      );

      closeAlert();
      successDialog(
        "Pengajuan Disetujui",
        `Pengajuan cuti dari ${userName} berhasil disetujui`
      );
    } catch (error) {
      closeAlert();
      console.error("Approve leave error:", error);
      errorDialog(
        "Gagal Menyetujui",
        error.response?.data?.error || error.message
      );
    } finally {
      setLoadingLeave(false);
    }
  };

  const handleRejectLeave = async (leave) => {
    const leaveId = getLeaveId(leave);
    const userName = leave.userName || "Karyawan";

    if (!leaveId) {
      errorToast("ID cuti tidak valid");
      return;
    }

    const confirmationResult = await confirmation(
      "Tolak Pengajuan Cuti",
      `Apakah Anda yakin ingin menolak pengajuan cuti dari ${userName}?`,
      "Ya, Tolak"
    );

    if (!confirmationResult.isConfirmed) {
      return;
    }

    try {
      setLoadingLeave(true);
      const loadingAlert = showLoadingAlert("Menolak pengajuan cuti...");

      await api.put(`/leaves/${leaveId}/status`, {
        status: "rejected",
        processedBy: null,
      });

      // Update local state
      setLeaveData((prev) =>
        prev.map((item) =>
          getLeaveId(item) === leaveId
            ? {
                ...item,
                status: "rejected",
                processedAt: new Date().toISOString(),
                processedByName: "Admin",
              }
            : item
        )
      );

      closeAlert();
      successDialog(
        "Pengajuan Ditolak",
        `Pengajuan cuti dari ${userName} telah ditolak`
      );
    } catch (error) {
      closeAlert();
      console.error("Reject leave error:", error);
      errorDialog(
        "Gagal Menolak",
        error.response?.data?.error || error.message
      );
    } finally {
      setLoadingLeave(false);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyDateRange = async () => {
    // Validasi date range
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    if (start > end) {
      errorToast("Tanggal mulai tidak boleh setelah tanggal selesai");
      return;
    }

    // Validasi range maksimal 1 tahun
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (end - start > oneYearMs) {
      warningToast("Rentang waktu maksimal 1 tahun");
      return;
    }

    await loadReportData();
  };

  const exportReport = async () => {
    try {
      const confirmationResult = await confirmation(
        "Export Laporan",
        "Apakah Anda ingin mengexport laporan dalam format JSON?",
        "Ya, Export"
      );

      if (!confirmationResult.isConfirmed) {
        return;
      }

      const loadingAlert = showLoadingAlert("Mempersiapkan file export...");

      const report = {
        title: "Laporan Absensi Karyawan",
        period: reportData.summary.dateRange,
        summary: reportData.summary,
        employeeStats: reportData.employeeStats,
        exportDate: new Date().toISOString(),
        totalRecords: reportData.attendance.length,
      };

      // Simulasi delay untuk persiapan file
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-absensi-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      closeAlert();
      successToast("Laporan berhasil diexport", 2000);
    } catch (error) {
      closeAlert();
      errorToast("Gagal mengexport laporan");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      default:
        return "Menunggu";
    }
  };

  // Filter pending leaves for actions
  const pendingLeaves = leaveData.filter((leave) => leave.status === "pending");

  if (loading) {
    return <LoadingSpinner size="lg" text="Memuat laporan..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Laporan & Analytics
            </h2>
            <p className="text-sm text-gray-600">
              Analisis data absensi dan pengajuan cuti karyawan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              Periode: {reportData.summary.dateRange}
            </span>
            <button
              onClick={exportReport}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Calendar className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Pilih Periode</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyDateRange}
              disabled={loading}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading ? "Memuat..." : "Terapkan"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">
                Total Karyawan
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {reportData.summary.totalEmployees}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700">Hadir</p>
              <p className="text-lg font-bold text-green-600 mt-1">
                {reportData.summary.totalPresent}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700">Tidak Hadir</p>
              <p className="text-lg font-bold text-red-600 mt-1">
                {reportData.summary.totalAbsent}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700">
                Rate Kehadiran
              </p>
              <p className="text-lg font-bold text-blue-600 mt-1">
                {reportData.summary.attendanceRate?.toFixed(1)}%
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span>Trend Kehadiran Harian</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.attendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" name="Hadir" fill="#10B981" />
                <Bar dataKey="absent" name="Tidak Hadir" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span>Distribusi Kehadiran</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Hadir", value: reportData.summary.totalPresent },
                    {
                      name: "Tidak Hadir",
                      value: reportData.summary.totalAbsent,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Performance */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Performance Karyawan
            </h3>
            <div className="text-xs text-gray-500">
              Periode: {reportData.summary.totalDays} hari kerja
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Karyawan
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hadir
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tidak Hadir
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate Kehadiran
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.employeeStats.map((employee, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-green-600 font-medium">
                      {employee.present} hari
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.totalDays
                        ? `${(
                            (employee.present / employee.totalDays) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-red-600 font-medium">
                      {employee.absent} hari
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.totalDays
                        ? `${(
                            (employee.absent / employee.totalDays) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(employee.attendanceRate, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          employee.attendanceRate >= 80
                            ? "text-green-600"
                            : employee.attendanceRate >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {employee.attendanceRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {reportData.employeeStats.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="font-medium">Rata-rata Kehadiran: </span>
                <span className="text-blue-600 font-semibold">
                  {reportData.employeeStats.length > 0
                    ? (
                        reportData.employeeStats.reduce(
                          (sum, emp) => sum + emp.attendanceRate,
                          0
                        ) / reportData.employeeStats.length
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div>
                <span className="font-medium">Karyawan Terbaik: </span>
                <span className="text-green-600 font-semibold">
                  {reportData.employeeStats.length > 0
                    ? reportData.employeeStats.reduce(
                        (best, emp) =>
                          emp.attendanceRate > best.attendanceRate ? emp : best,
                        reportData.employeeStats[0]
                      ).name
                    : "-"}
                </span>
              </div>
              <div>
                <span className="font-medium">Total Hari Analisis: </span>
                <span className="text-gray-600 font-semibold">
                  {reportData.summary.totalDays} hari
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leave Requests Report */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="h-4 w-4 text-purple-600" />
            <span>
              Pengajuan Cuti{" "}
              {pendingLeaves.length > 0 && (
                <span className="text-red-600">
                  ({pendingLeaves.length} Menunggu)
                </span>
              )}
            </span>
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={loadLeaveData}
              disabled={loadingLeave}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loadingLeave ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {loadingLeave ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="md" text="Memuat data cuti..." />
          </div>
        ) : leaveData.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Belum ada pengajuan cuti
            </h3>
            <p className="text-xs text-gray-600">
              Belum ada karyawan yang mengajukan cuti
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {leaveData.map((leave) => {
              const leaveId = getLeaveId(leave);
              return (
                <div key={leaveId} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {leave.userName} - {leave.userPosition}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {new Date(leave.startDate).toLocaleDateString(
                            "id-ID"
                          )}{" "}
                          -{" "}
                          {new Date(leave.endDate).toLocaleDateString("id-ID")}{" "}
                          (
                          {Math.ceil(
                            (new Date(leave.endDate) -
                              new Date(leave.startDate)) /
                              (1000 * 60 * 60 * 24)
                          ) + 1}{" "}
                          hari)
                        </span>
                      </div>

                      <h4 className="font-medium text-gray-900 text-sm capitalize">
                        {leave.type || "Cuti"}
                      </h4>
                      <p className="text-gray-600 text-xs mt-1">
                        {leave.reason}
                      </p>

                      <div className="mt-2 text-xs text-gray-500">
                        <p>
                          Diajukan{" "}
                          {new Date(leave.appliedAt).toLocaleDateString(
                            "id-ID"
                          )}
                        </p>
                        {leave.processedAt && (
                          <p className="mt-1">
                            Diproses{" "}
                            {new Date(leave.processedAt).toLocaleDateString(
                              "id-ID"
                            )}
                            {leave.processedByName &&
                              ` oleh ${leave.processedByName}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-2">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(leave.status)}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            leave.status
                          )}`}
                        >
                          {getStatusText(leave.status)}
                        </span>
                      </div>

                      {/* Action buttons for pending requests */}
                      {leave.status === "pending" && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleApproveLeave(leave)}
                            disabled={loadingLeave}
                            className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-xs"
                            title="Setujui"
                          >
                            <UserCheck className="h-3 w-3" />
                            <span>Setujui</span>
                          </button>
                          <button
                            onClick={() => handleRejectLeave(leave)}
                            disabled={loadingLeave}
                            className="flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-xs"
                            title="Tolak"
                          >
                            <UserX className="h-3 w-3" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
