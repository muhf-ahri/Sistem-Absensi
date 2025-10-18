import React, { useState, useEffect } from "react";
import { api } from "../../utils/API";
import { useAuth } from "../../context/AuthContext";
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const Attendance = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [officeLocation, setOfficeLocation] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    getCurrentLocation();
    loadTodayAttendance();
    loadOfficeLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser ini");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (error) => {
        setError("Gagal mendapatkan lokasi: " + error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const loadTodayAttendance = async () => {
    try {
      const response = await api.get(`/attendance/today/${user.id}`);
      console.log("Today attendance data:", response.data);
      setTodayAttendance(response.data);
    } catch (error) {
      console.error("Error loading attendance:", error);
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
      setError("Lokasi tidak tersedia. Silakan refresh halaman.");
      return;
    }

    if (!isWithinOfficeRadius()) {
      setError(
        "Anda berada di luar radius kantor. Tidak dapat melakukan check-in."
      );
      return;
    }

    setLoading(true);
    try {
      await api.post("/attendance/check-in", {
        userId: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      });

      await loadTodayAttendance();
      setError("");
      alert("Check-in berhasil!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Gagal melakukan check-in";
      setError(errorMessage);
      alert(errorMessage);
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    if (!location) {
      setError("Lokasi tidak tersedia. Silakan refresh halaman.");
      return;
    }

    if (!isWithinOfficeRadius()) {
      setError(
        "Anda berada di luar radius kantor. Tidak dapat melakukan check-out."
      );
      return;
    }

    setLoading(true);
    try {
      await api.post("/attendance/check-out", {
        userId: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      });

      await loadTodayAttendance();
      setError("");
      alert("Check-out berhasil!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Gagal melakukan check-out";
      setError(errorMessage);
      alert(errorMessage);
    }
    setLoading(false);
  };

  // Helper untuk cek status
  const hasCheckedIn =
    todayAttendance?.checkIn && todayAttendance.checkIn.timestamp;
  const hasCheckedOut =
    todayAttendance?.checkOut && todayAttendance.checkOut.timestamp;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Absensi Hari Ini
        </h2>

        {/* Status Lokasi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Status Lokasi
                </p>
                <p className="text-lg font-semibold text-blue-700">
                  {location ? (
                    isWithinOfficeRadius() ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        Dalam Radius Kantor
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <XCircle className="h-5 w-5 mr-1" />
                        Di Luar Radius
                      </span>
                    )
                  ) : (
                    "Mendeteksi..."
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Status Absensi
                </p>
                <p className="text-lg font-semibold text-green-700">
                  {hasCheckedIn ? "Sudah Check-in" : "Belum Check-in"}
                  {hasCheckedOut && " • Sudah Check-out"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Koordinat */}
        {location && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Koordinat Anda
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Latitude: {location.latitude.toFixed(6)}</p>
              <p>Longitude: {location.longitude.toFixed(6)}</p>
              <p>Akurasi: ±{location.accuracy.toFixed(2)} meter</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleCheckIn}
            disabled={
              loading || !location || hasCheckedIn || !isWithinOfficeRadius()
            }
            className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span>{loading ? "Memproses..." : "Check-in"}</span>
          </button>

          <button
            onClick={handleCheckOut}
            disabled={loading || !location || !hasCheckedIn || hasCheckedOut}
            className="flex-1 py-3 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Clock className="h-5 w-5" />
            <span>{loading ? "Memproses..." : "Check-out"}</span>
          </button>

          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="flex-1 py-3 px-6 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <MapPin className="h-5 w-5" />
            <span>Refresh Lokasi</span>
          </button>
        </div>
      </div>

      {/* Riwayat Absensi Hari Ini */}
      {todayAttendance && (hasCheckedIn || hasCheckedOut) && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Riwayat Hari Ini
          </h3>
          <div className="space-y-3">
            {hasCheckedIn && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <span className="text-blue-700 font-medium">Check-in</span>
                  <p className="text-xs text-blue-600">
                    Lokasi: {todayAttendance.checkIn.latitude?.toFixed(6)},{" "}
                    {todayAttendance.checkIn.longitude?.toFixed(6)}
                  </p>
                </div>
                <span className="text-blue-600 font-medium">
                  {new Date(
                    todayAttendance.checkIn.timestamp
                  ).toLocaleTimeString()}
                </span>
              </div>
            )}
            {hasCheckedOut && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <span className="text-green-700 font-medium">Check-out</span>
                  <p className="text-xs text-green-600">
                    Lokasi: {todayAttendance.checkOut.latitude?.toFixed(6)},{" "}
                    {todayAttendance.checkOut.longitude?.toFixed(6)}
                  </p>
                </div>
                <span className="text-green-600 font-medium">
                  {new Date(
                    todayAttendance.checkOut.timestamp
                  ).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
