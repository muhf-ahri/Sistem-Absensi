// File: src/pages/Dashboard/Dashboard.js (atau sesuaikan path-nya)

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
  Camera,
} from "lucide-react";

// Komponen Face Verification (diambil dari Attendance.js dan dimodifikasi sedikit)
const FaceVerification = ({ onVerificationSuccess, onVerificationFail, onClose, type = 'checkin' }) => {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [stream, setStream] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [capturedImage, setCapturedImage] = useState(null);

  const {
    loading: showLoadingAlert,
    close: closeAlert,
    errorToast,
    successToast
  } = useSweetAlert();

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setVerificationStatus('capturing');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      errorToast('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
      setVerificationStatus('idle');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setVerificationStatus('idle');
    setCapturedImage(null);
  };

  const captureFace = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    verifyFace(imageData);
  };

  const verifyFace = async (imageData) => {
    setVerificationStatus('verifying');
    const loadingAlert = showLoadingAlert('Memverifikasi wajah...');

    try {
      // Simulasi verifikasi wajah
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          const isSuccess = Math.random() > 0.1; // 90% sukses
          if (isSuccess) {
            resolve();
          } else {
            reject(new Error('Verifikasi gagal'));
          }
        }, 2000);
      });

      closeAlert();
      setVerificationStatus('success');
      successToast('Verifikasi wajah berhasil!');

      setTimeout(() => {
        stopCamera();
        if (onVerificationSuccess) {
          onVerificationSuccess(imageData);
        }
      }, 1500);

    } catch (error) {
      closeAlert();
      setVerificationStatus('failed');
      errorToast('Verifikasi wajah gagal. Silakan coba lagi.');
    }
  };

  const retryVerification = () => {
    setVerificationStatus('capturing');
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] min-h-screen">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Verifikasi Wajah - {type === 'checkin' ? 'Check-in' : 'Check-out'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Camera Preview */}
          {verificationStatus === 'capturing' && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-gray-200 rounded-lg object-cover"
              />
              <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-full opacity-50"></div>
              </div>
            </div>
          )}

          {/* Captured Image Preview */}
          {capturedImage && verificationStatus !== 'capturing' && (
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-full h-64 bg-gray-200 rounded-lg object-cover"
              />
              <div className="absolute top-2 right-2">
                {verificationStatus === 'success' && (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                )}
                {verificationStatus === 'failed' && (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
            </div>
          )}

          {/* Status Messages */}
          <div className="text-center">
            {verificationStatus === 'idle' && (
              <div className="space-y-2">
                <Camera className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-gray-600">Siap untuk verifikasi wajah</p>
                <p className="text-sm text-gray-500">
                  Pastikan wajah Anda terlihat jelas dan pencahayaan cukup
                </p>
              </div>
            )}

            {verificationStatus === 'capturing' && (
              <div className="space-y-2">
                <Camera className="h-8 w-8 mx-auto text-blue-500 animate-pulse" />
                <p className="text-gray-600">Arahkan wajah ke dalam lingkaran</p>
              </div>
            )}

            {verificationStatus === 'verifying' && (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600">Memverifikasi wajah...</p>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="space-y-2">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <p className="text-green-600 font-medium">Verifikasi Berhasil!</p>
              </div>
            )}

            {verificationStatus === 'failed' && (
              <div className="space-y-2">
                <XCircle className="h-12 w-12 mx-auto text-red-500" />
                <p className="text-red-600 font-medium">Verifikasi Gagal</p>
              </div>
            )}
          </div>

          {/* Hidden canvas */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            {verificationStatus === 'idle' && (
              <>
                <button
                  onClick={startCamera}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>Mulai Verifikasi</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
              </>
            )}

            {verificationStatus === 'capturing' && (
              <>
                <button
                  onClick={captureFace}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Ambil Foto</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Ulangi
                </button>
              </>
            )}

            {verificationStatus === 'failed' && (
              <>
                <button
                  onClick={retryVerification}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Coba Lagi
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Tutup
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [verificationType, setVerificationType] = useState('checkin');
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
        successToast("Lokasi berhasil didapatkan", 2000);
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
      const data = response.data;
      if (data && data.latitude && data.longitude) {
        setOfficeLocation({
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          radius: parseInt(data.radius) || 100,
          address: data.address || 'Alamat kantor belum diatur'
        });
      }
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
      officeLocation.lat,
      officeLocation.lng
    );

    return distance <= officeLocation.radius;
  };

  const handleCheckIn = async (faceImageData = null) => {
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

    // Show face verification if not already verified
    if (!faceImageData) {
      setVerificationType('checkin');
      setShowFaceVerification(true);
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
        faceImage: faceImageData, // Tambahkan data wajah
        verificationMethod: 'face' // Tambahkan metode verifikasi
      });

      await loadDashboardData(); // Refresh data dashboard
      closeAlert();
      successDialog("Check-in Berhasil!", "Anda berhasil melakukan check-in dengan verifikasi wajah");
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Gagal melakukan check-in";
      closeAlert();
      errorDialog("Check-in Gagal", errorMessage);
    }
    setAttendanceLoading(false);
  };

  const handleCheckOut = async (faceImageData = null) => {
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

    // Show face verification if not already verified
    if (!faceImageData) {
      setVerificationType('checkout');
      setShowFaceVerification(true);
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
        faceImage: faceImageData, // Tambahkan data wajah
        verificationMethod: 'face' // Tambahkan metode verifikasi
      });

      await loadDashboardData(); // Refresh data dashboard
      closeAlert();
      successDialog("Check-out Berhasil!", "Anda berhasil melakukan check-out dengan verifikasi wajah");
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Gagal melakukan check-out";
      closeAlert();
      errorDialog("Check-out Gagal", errorMessage);
    }
    setAttendanceLoading(false);
  };

  const handleFaceVerificationSuccess = (faceImageData) => {
    setShowFaceVerification(false);

    if (verificationType === 'checkin') {
      handleCheckIn(faceImageData);
    } else {
      handleCheckOut(faceImageData);
    }
  };

  const handleFaceVerificationClose = () => {
    setShowFaceVerification(false);
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
      {/* Face Verification Modal */}
      {showFaceVerification && (
        <FaceVerification
          onVerificationSuccess={handleFaceVerificationSuccess}
          onVerificationFail={() => setShowFaceVerification(false)}
          onClose={handleFaceVerificationClose}
          type={verificationType}
        />
      )}

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
              onClick={() => handleCheckIn()} // Panggil handleCheckIn tanpa parameter untuk memicu verifikasi
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
              <Camera className="h-4 w-4" />
              <CheckCircle className="h-4 w-4" />
              <span>{attendanceLoading ? "Memproses..." : "Check-in Wajah"}</span>
            </button>

            <button
              onClick={() => handleCheckOut()} // Panggil handleCheckOut tanpa parameter untuk memicu verifikasi
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
              <Camera className="h-4 w-4" />
              <Clock className="h-4 w-4" />
              <span>{attendanceLoading ? "Memproses..." : "Check-out Wajah"}</span>
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

        {/* Bagian ini kosong karena peta dihapus */}
        {/* <div className="mt-4">
          <DashboardMap
            officeLocation={officeLocation}
            userLocation={userLocationForMap}
          />
        </div> */}
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
                {/* Tambahkan info verifikasi wajah */}
                <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-gray-600">
                  <p>✅ Check-in: {stats.todayAttendance.checkIn.verificationMethod === 'face' ? 'Verifikasi Wajah' : 'Lainnya'}</p>
                  {stats.todayAttendance.checkOut && (
                    <p>✅ Check-out: {stats.todayAttendance.checkOut.verificationMethod === 'face' ? 'Verifikasi Wajah' : 'Lainnya'}</p>
                  )}
                </div>
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
                {stats.monthlyPresent + stats.monthlyAbsent > 0 ?
                  Math.round(
                    (stats.monthlyPresent /
                      (stats.monthlyPresent + stats.monthlyAbsent)) *
                    100
                  ) : 0
                }%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${stats.monthlyPresent + stats.monthlyAbsent > 0 ?
                    (stats.monthlyPresent /
                      (stats.monthlyPresent + stats.monthlyAbsent)) *
                    100 : 0
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