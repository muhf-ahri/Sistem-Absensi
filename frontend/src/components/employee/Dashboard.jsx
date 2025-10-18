import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../utils/API";
import { useSweetAlert } from "../../hooks/useSweetAlert";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  MapPin,
  AlertCircle,
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayAttendance: null,
    monthlyPresent: 0,
    monthlyAbsent: 0,
    leaveRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [officeLocation, setOfficeLocation] = useState(null);
  const { user } = useAuth();

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
    loadDashboardData();
    loadOfficeLocation();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      errorToast("Geolocation tidak didukung oleh browser ini");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const errorMessage = "Gagal mendapatkan lokasi: " + error.message;
        errorToast(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get today's attendance
      const todayResponse = await api.get(`/attendance/today/${user.id}`);

      // Get attendance history for this month
      const currentDate = new Date();
      const firstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      )
        .toISOString()
        .split("T")[0];

      const historyResponse = await api.get(
        `/attendance/history/${user.id}?startDate=${firstDay}&endDate=${lastDay}`
      );

      // Get leave stats
      const leaveResponse = await api.get(`/leaves/stats/${user.id}`);

      const attendanceHistory = historyResponse.data;
      const presentDays = attendanceHistory.filter(
        (record) => record.checkIn
      ).length;
      const totalWorkingDays = new Date().getDate(); // Approximate

      setStats({
        todayAttendance: todayResponse.data,
        monthlyPresent: presentDays,
        monthlyAbsent: totalWorkingDays - presentDays,
        leaveRequests: leaveResponse.data.pending || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      errorToast("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadOfficeLocation = async () => {
    try {
      const response = await api.get("/settings/office-location");
      setOfficeLocation(response.data);
    } catch (error) {
      console.error("Error loading office location:", error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  };

  const isWithinOfficeRadius = () => {
    if (!location || !officeLocation) return false;

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      officeLocation.latitude,
      officeLocation.longitude
    );

    return distance <= officeLocation.radius;
  };

  const handleCheckIn = async () => {
    if (!location) {
      const result = await confirmation(
        "Lokasi Tidak Tersedia",
        "Lokasi tidak terdeteksi. Apakah Anda ingin mencoba mendapatkan lokasi kembali?",
        "Ya, Dapatkan Lokasi"
      );

      if (result.isConfirmed) {
        getCurrentLocation();
      }
      return;
    }

    if (!isWithinOfficeRadius()) {
      warningToast(
        "Anda berada di luar radius kantor. Tidak dapat melakukan check-in."
      );
      return;
    }

    const confirmationResult = await confirmation(
      "Check-in",
      "Apakah Anda yakin ingin melakukan check-in?",
      "Ya, Check-in"
    );

    if (!confirmationResult.isConfirmed) {
      return;
    }

    setAttendanceLoading(true);
    const loadingAlert = showLoadingAlert("Melakukan check-in...");

    try {
      await api.post("/attendance/check-in", {
        userId: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      });

      await loadDashboardData();
      closeAlert();

      successDialog("Check-in Berhasil!", "Anda berhasil melakukan check-in");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Gagal melakukan check-in";
      closeAlert();

      errorDialog("Check-in Gagal", errorMessage);
    }
    setAttendanceLoading(false);
  };

  const handleCheckOut = async () => {
    if (!location) {
      const result = await confirmation(
        "Lokasi Tidak Tersedia",
        "Lokasi tidak terdeteksi. Apakah Anda ingin mencoba mendapatkan lokasi kembali?",
        "Ya, Dapatkan Lokasi"
      );

      if (result.isConfirmed) {
        getCurrentLocation();
      }
      return;
    }

    if (!isWithinOfficeRadius()) {
      warningToast(
        "Anda berada di luar radius kantor. Tidak dapat melakukan check-out."
      );
      return;
    }

    const confirmationResult = await confirmation(
      "Check-out",
      "Apakah Anda yakin ingin melakukan check-out?",
      "Ya, Check-out"
    );

    if (!confirmationResult.isConfirmed) {
      return;
    }

    setAttendanceLoading(true);
    const loadingAlert = showLoadingAlert("Melakukan check-out...");

    try {
      await api.post("/attendance/check-out", {
        userId: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      });

      await loadDashboardData();
      closeAlert();

      successDialog("Check-out Berhasil!", "Anda berhasil melakukan check-out");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Gagal melakukan check-out";
      closeAlert();

      errorDialog("Check-out Gagal", errorMessage);
    }
    setAttendanceLoading(false);
  };

  const handleRefreshLocation = () => {
    getCurrentLocation();
    successToast("Lokasi diperbarui", 2000);
  };

  // Helper untuk cek status
  const hasCheckedIn =
    stats.todayAttendance?.checkIn && stats.todayAttendance.checkIn.timestamp;
  const hasCheckedOut =
    stats.todayAttendance?.checkOut && stats.todayAttendance.checkOut.timestamp;

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard Karyawan
            </h2>
            <p className="text-gray-600">
              Ringkasan aktivitas dan statistik Anda
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCheckIn}
              disabled={
                attendanceLoading ||
                !location ||
                hasCheckedIn ||
                !isWithinOfficeRadius()
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              title={
                !isWithinOfficeRadius()
                  ? "Anda berada di luar radius kantor"
                  : ""
              }
            >
              <CheckCircle className="h-4 w-4" />
              <span>{attendanceLoading ? "Memproses..." : "Check-in"}</span>
            </button>

            <button
              onClick={handleCheckOut}
              disabled={
                attendanceLoading || !location || !hasCheckedIn || hasCheckedOut
              }
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              title={
                !isWithinOfficeRadius()
                  ? "Anda berada di luar radius kantor"
                  : ""
              }
            >
              <Clock className="h-4 w-4" />
              <span>{attendanceLoading ? "Memproses..." : "Check-out"}</span>
            </button>

            <button
              onClick={handleRefreshLocation}
              disabled={attendanceLoading}
              className="px-4 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Refresh Lokasi</span>
            </button>
          </div>
        </div>

        {/* Location Status */}
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Status Lokasi
                </p>
                <p className="text-sm text-gray-600">
                  {location ? (
                    isWithinOfficeRadius() ? (
                      <span className="text-green-600">
                        ✅ Dalam radius kantor
                      </span>
                    ) : (
                      <span className="text-red-600">
                        ❌ Di luar radius kantor
                      </span>
                    )
                  ) : (
                    "Mendeteksi lokasi..."
                  )}
                </p>
              </div>
            </div>
            {location && (
              <div className="text-right text-xs text-gray-500">
                <p>Akurasi: ±{location.accuracy.toFixed(0)}m</p>
                {officeLocation && <p>Radius: {officeLocation.radius}m</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Status */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Status Hari Ini
              </p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  stats.todayAttendance?.checkIn
                    ? stats.todayAttendance?.checkOut
                      ? "text-green-600"
                      : "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {stats.todayAttendance?.checkIn
                  ? stats.todayAttendance?.checkOut
                    ? "Completed"
                    : "Checked In"
                  : "Not Checked In"}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl ${
                stats.todayAttendance?.checkIn
                  ? stats.todayAttendance?.checkOut
                    ? "bg-green-100"
                    : "bg-blue-100"
                  : "bg-red-100"
              }`}
            >
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
              <p className="text-sm font-medium text-gray-600">
                Hadir (Bulan Ini)
              </p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Aktivitas Hari Ini
          </h3>
          <div className="space-y-4">
            {stats.todayAttendance?.checkIn ? (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    <span className="text-blue-700 font-medium">Check-in</span>
                  </div>
                  <span className="text-blue-600">
                    {new Date(
                      stats.todayAttendance.checkIn.timestamp
                    ).toLocaleTimeString()}
                  </span>
                </div>
                {stats.todayAttendance.checkOut && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                      <span className="text-green-700 font-medium">
                        Check-out
                      </span>
                    </div>
                    <span className="text-green-600">
                      {new Date(
                        stats.todayAttendance.checkOut.timestamp
                      ).toLocaleTimeString()}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistik Kehadiran
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rate Kehadiran</span>
              <span className="font-semibold text-green-600">
                {Math.round(
                  (stats.monthlyPresent /
                    (stats.monthlyPresent + stats.monthlyAbsent)) *
                    100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (stats.monthlyPresent /
                      (stats.monthlyPresent + stats.monthlyAbsent)) *
                    100
                  }%`,
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
