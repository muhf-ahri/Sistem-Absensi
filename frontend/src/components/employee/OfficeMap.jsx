// File: src/pages/OfficeMap/OfficeMap.jsx (atau sesuaikan path-nya)

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { api } from '../../utils/API';
import { MapPin, Navigation, Target, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png', // [Perbaikan: Hapus spasi]
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',         // [Perbaikan: Hapus spasi]
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',    // [Perbaikan: Hapus spasi]
});

// Custom icons
const officeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', // [Perbaikan: Hapus spasi]
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // [Perbaikan: Hapus spasi]
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', // [Perbaikan: Hapus spasi]
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // [Perbaikan: Hapus spasi]
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

const OfficeMap = () => {
  const [officeLocation, setOfficeLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadOfficeLocation();
    getUserLocation();
    checkMobileDevice();

    // Setup resize listener
    window.addEventListener('resize', checkMobileDevice);
    return () => {
      window.removeEventListener('resize', checkMobileDevice);
    };
  }, []);

  // Check if device is mobile
  const checkMobileDevice = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
  };

  const loadOfficeLocation = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/office-location');
      const data = response.data;
      
      if (data && data.latitude && data.longitude) {
        setOfficeLocation({
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          radius: parseInt(data.radius) || 100,
          address: data.address || 'Alamat kantor belum diatur'
        });
      } else {
        setError('Lokasi kantor belum diatur');
      }
    } catch (error) {
      console.error('Error loading office location:', error);
      setError('Gagal memuat lokasi kantor');
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser ini');
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        console.error('Error getting user location:', error);
        let errorMessage = 'Gagal mendapatkan lokasi Anda: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Izin lokasi ditolak';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            errorMessage += 'Permintaan lokasi timeout';
            break;
          default:
            errorMessage += error.message;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const refreshLocations = () => {
    setError('');
    loadOfficeLocation();
    getUserLocation();
    setMapKey(prev => prev + 1);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000;
    return Math.round(distance);
  };

  const isWithinRadius = () => {
    if (!userLocation || !officeLocation) return false;
    const distance = calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      officeLocation.lat, 
      officeLocation.lng
    );
    return distance <= officeLocation.radius;
  };

  // Check if should show map: Show only if NOT mobile OR if mobile but we assume sidebar is closed (we can't detect it reliably)
  // In mobile, we will hide the map to avoid overlap with sidebar.
  const shouldShowMap = !isMobile;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Memuat peta...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Peta Lokasi Kantor</h2>
            <p className="text-gray-600">Lihat lokasi kantor dan radius absensi yang diperbolehkan</p>
          </div>
          <button
            onClick={refreshLocations}
            className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Info Cards */}
      {officeLocation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Target className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Lokasi Kantor</p>
                <p className="text-lg font-semibold text-gray-900">{officeLocation.address}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>Latitude: {officeLocation.lat.toFixed(6)}</p>
              <p>Longitude: {officeLocation.lng.toFixed(6)}</p>
              <p>Radius Absensi: {officeLocation.radius} meter</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <Navigation className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Status Lokasi Anda</p>
                <p className="text-lg font-semibold text-gray-900">
                  {userLocation ? (
                    <span>
                      {calculateDistance(userLocation.lat, userLocation.lng, officeLocation.lat, officeLocation.lng)} meter dari kantor
                    </span>
                  ) : (
                    'Lokasi tidak terdeteksi'
                  )}
                </p>
              </div>
            </div>
            {userLocation && (
              <div className="mt-4">
                <p className={`text-sm font-medium ${
                  isWithinRadius() ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isWithinRadius()
                    ? '✅ Anda berada dalam radius absensi'
                    : '❌ Anda berada di luar radius absensi'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map - Conditional Rendering */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Peta Interaktif</h3>
        
        {error ? (
          <div className="text-center py-12 text-red-600 bg-red-50 rounded-xl">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-red-400" />
            <p className="mb-4">{error}</p>
            <button
              onClick={refreshLocations}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : officeLocation ? (
          shouldShowMap ? (
            <div className="h-96 rounded-xl overflow-hidden border border-gray-200">
              <MapContainer
                key={mapKey}
                center={[officeLocation.lat, officeLocation.lng]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <MapController center={officeLocation} />
                
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Office Marker */}
                <Marker 
                  position={[officeLocation.lat, officeLocation.lng]}
                  icon={officeIcon}
                >
                  <Popup>
                    <div className="text-center min-w-[200px]">
                      <strong className="text-blue-600">📍 Lokasi Kantor</strong>
                      <br />
                      <p className="mt-1">{officeLocation.address}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Radius: {officeLocation.radius}m
                      </p>
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
                      <div className="text-center min-w-[200px]">
                        <strong className="text-green-600">📍 Lokasi Anda</strong>
                        <br />
                        <p className="mt-1">
                          {calculateDistance(userLocation.lat, userLocation.lng, officeLocation.lat, officeLocation.lng)}m dari kantor
                        </p>
                        <p className={`text-sm font-medium mt-1 ${
                          isWithinRadius() ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isWithinRadius() ? '✅ Dalam radius' : '❌ Luar radius'}
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
          ) : (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">Peta disembunyikan di mode mobile</p>
              <p className="text-sm text-gray-500 mt-1">Untuk melihat peta, gunakan mode desktop atau buka aplikasi di layar yang lebih besar.</p>
            </div>
          )
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p>Lokasi kantor belum diatur</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {shouldShowMap && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Keterangan Peta:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <img 
                  src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" 
                  alt="Office Marker" 
                  className="w-4 h-6"
                />
              </div>
              <span className="text-gray-700">Lokasi Kantor</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <img 
                  src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" 
                  alt="User Marker" 
                  className="w-4 h-6"
                />
              </div>
              <span className="text-gray-700">Lokasi Anda</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-blue-500 rounded-full"></div>
              <span className="text-gray-700">Radius Absensi ({officeLocation?.radius || 0}m)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 bg-opacity-10 rounded-full border border-blue-300"></div>
              <span className="text-gray-700">Area Di Dalam Radius Kantor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeMap;