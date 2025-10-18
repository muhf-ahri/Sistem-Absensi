// File: src/pages/Attendance/Attendance.js (atau sesuaikan path-nya)

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { api } from "../../utils/API";
import { useAuth } from "../../context/AuthContext";
import { useSweetAlert } from "../../hooks/useSweetAlert";
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Camera } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png', // [Perbaikan 4: Hapus spasi]
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',         // [Perbaikan 4: Hapus spasi]
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',    // [Perbaikan 4: Hapus spasi]
});

// Custom icons
const officeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', // [Perbaikan 4: Hapus spasi]
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // [Perbaikan 4: Hapus spasi]
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', // [Perbaikan 4: Hapus spasi]
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // [Perbaikan 4: Hapus spasi]
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to center map when office location changes
const MapController = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], 16, {
        animate: true,
        duration: 1
      });
    }
  }, [center, map]);

  return null;
};

// Face Verification Component
const FaceVerification = ({ 
  onVerificationSuccess, 
  onVerificationFail, 
  onClose,
  type = 'checkin'
}) => {
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
          const isSuccess = Math.random() > 0.1;
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
    // [Perbaikan 1, 2, 3: Ganti z-index, tambahkan backdrop-blur, tambahkan min-h-screen]
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

// Mini Map Component untuk Attendance
const AttendanceMap = ({ officeLocation, userLocation, onRefresh }) => {
  const [mapKey, setMapKey] = useState(0);

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
    return Math.round(R * c * 1000);
  };

  const refreshMap = () => {
    setMapKey(prev => prev + 1);
    onRefresh();
  };

  if (!officeLocation) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 h-48 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Lokasi kantor belum diatur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Peta Lokasi</h3>
        <button
          onClick={refreshMap}
          className="p-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Refresh peta"
        >
          <RefreshCw className="h-3 w-3 text-gray-600" />
        </button>
      </div>

      <div className="h-40 rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          key={mapKey}
          center={[officeLocation.lat, officeLocation.lng]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          zoomControl={false}
          dragging={false}
          doubleClickZoom={false}
        >
          <MapController center={officeLocation} />
          
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          
          {/* Office Marker */}
          <Marker 
            position={[officeLocation.lat, officeLocation.lng]}
            icon={officeIcon}
          >
            <Popup>
              <div className="text-center">
                <strong className="text-blue-600">📍 Kantor</strong>
                <p className="text-xs mt-1">Radius: {officeLocation.radius}m</p>
              </div>
            </Popup>
          </Marker>
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong className="text-green-600">📍 Anda</strong>
                  <p className="text-xs mt-1">
                    {calculateDistance(userLocation.lat, userLocation.lng, officeLocation.lat, officeLocation.lng)}m dari kantor
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Office Radius Circle */}
          <Circle
            center={[officeLocation.lat, officeLocation.lng]}
            radius={officeLocation.radius}
            pathOptions={{ 
              color: 'blue', 
              fillColor: 'blue', 
              fillOpacity: 0.1,
              weight: 2
            }}
          />
        </MapContainer>
      </div>

      {/* Legend Mini */}
      <div className="mt-2 flex justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 flex items-center justify-center">
            <img 
              src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" // [Perbaikan 4: Hapus spasi]
              alt="Office" 
              className="w-2 h-3"
            />
          </div>
          <span>Kantor</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 flex items-center justify-center">
            <img 
              src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" // [Perbaikan 4: Hapus spasi]
              alt="User" 
              className="w-2 h-3"
            />
          </div>
          <span>Anda</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border border-blue-500 rounded-full"></div>
          <span>Radius</span>
        </div>
      </div>
    </div>
  );
};

const Attendance = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [officeLocation, setOfficeLocation] = useState(null);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [verificationType, setVerificationType] = useState('checkin');
  const { user } = useAuth();
  
  const {
    successToast,
    errorToast,
    warningToast,
    confirmation,
    successDialog,
    errorDialog,
    loading: showLoadingAlert,
    close: closeAlert
  } = useSweetAlert();

  useEffect(() => {
    getCurrentLocation();
    loadTodayAttendance();
    loadOfficeLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser ini");
      errorToast("Geolocation tidak didukung oleh browser ini");
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
        successToast("Lokasi berhasil didapatkan", 2000);
      },
      (error) => {
        const errorMessage = "Gagal mendapatkan lokasi: " + error.message;
        setError(errorMessage);
        setLoading(false);
        errorToast(errorMessage);
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
      errorToast("Gagal memuat data absensi hari ini");
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
      errorToast("Gagal memuat lokasi kantor");
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
      warningToast("Anda berada di luar radius kantor. Tidak dapat melakukan check-in.");
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

    setLoading(true);
    const loadingAlert = showLoadingAlert("Melakukan check-in...");
    
    try {
      await api.post("/attendance/check-in", {
        userId: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
        faceImage: faceImageData,
        verificationMethod: 'face'
      });

      await loadTodayAttendance();
      setError("");
      closeAlert();
      
      successDialog("Check-in Berhasil!", "Anda berhasil melakukan check-in dengan verifikasi wajah");
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Gagal melakukan check-in";
      setError(errorMessage);
      closeAlert();
      
      errorDialog("Check-in Gagal", errorMessage);
    }
    setLoading(false);
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
      warningToast("Anda berada di luar radius kantor. Tidak dapat melakukan check-out.");
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

    setLoading(true);
    const loadingAlert = showLoadingAlert("Melakukan check-out...");
    
    try {
      await api.post("/attendance/check-out", {
        userId: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
        faceImage: faceImageData,
        verificationMethod: 'face'
      });

      await loadTodayAttendance();
      setError("");
      closeAlert();
      
      successDialog("Check-out Berhasil!", "Anda berhasil melakukan check-out dengan verifikasi wajah");
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Gagal melakukan check-out";
      setError(errorMessage);
      closeAlert();
      
      errorDialog("Check-out Gagal", errorMessage);
    }
    setLoading(false);
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

  const handleRefreshMap = () => {
    getCurrentLocation();
    loadOfficeLocation();
  };

  // Helper untuk cek status
  const hasCheckedIn = todayAttendance?.checkIn && todayAttendance.checkIn.timestamp;
  const hasCheckedOut = todayAttendance?.checkOut && todayAttendance.checkOut.timestamp;

  // Format user location for map
  const userLocationForMap = location ? {
    lat: location.latitude,
    lng: location.longitude
  } : null;

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

        {/* Grid untuk Koordinat dan Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Koordinat */}
          {location && (
            <div className="bg-gray-50 rounded-xl p-4">
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

          {/* Mini Map */}
          <AttendanceMap 
            officeLocation={officeLocation}
            userLocation={userLocationForMap}
            onRefresh={handleRefreshMap}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tombol Aksi dengan Face Verification */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => handleCheckIn()}
            disabled={
              loading || !location || hasCheckedIn || !isWithinOfficeRadius()
            }
            className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Camera className="h-5 w-5" />
            <CheckCircle className="h-5 w-5" />
            <span>{loading ? "Memproses..." : "Check-in dengan Wajah"}</span>
          </button>

          <button
            onClick={() => handleCheckOut()}
            disabled={loading || !location || !hasCheckedIn || hasCheckedOut}
            className="flex-1 py-3 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Camera className="h-5 w-5" />
            <Clock className="h-5 w-5" />
            <span>{loading ? "Memproses..." : "Check-out dengan Wajah"}</span>
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

        {/* Informasi Face Verification */}
        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <Camera className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Verifikasi Wajah Diperlukan
              </p>
              <p className="text-sm text-blue-700">
                Setiap absensi memerlukan verifikasi wajah untuk keamanan
              </p>
            </div>
          </div>
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
                  {todayAttendance.checkIn.verificationMethod === 'face' && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Terverifikasi Wajah
                    </p>
                  )}
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
                  {todayAttendance.checkOut.verificationMethod === 'face' && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Terverifikasi Wajah
                    </p>
                  )}
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