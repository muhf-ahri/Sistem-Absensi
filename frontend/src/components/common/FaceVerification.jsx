import React, { useRef, useState, useEffect } from 'react';
import { useSweetAlert } from '../../hooks/useSweetAlert';
import { Camera, UserCheck, XCircle, CheckCircle } from 'lucide-react';

const FaceVerification = ({ 
  onVerificationSuccess, 
  onVerificationFail, 
  onClose,
  type = 'checkin' // 'checkin' or 'checkout'
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle', 'capturing', 'verifying', 'success', 'failed'
  const [capturedImage, setCapturedImage] = useState(null);
  
  const {
    loading: showLoadingAlert,
    close: closeAlert,
    errorToast,
    successToast
  } = useSweetAlert();

  useEffect(() => {
    return () => {
      // Cleanup stream when component unmounts
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

    // Set canvas size same as video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 for face verification
    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    
    // Start verification process
    verifyFace(imageData);
  };

  const verifyFace = async (imageData) => {
    setVerificationStatus('verifying');
    const loadingAlert = showLoadingAlert('Memverifikasi wajah...');

    try {
      // Simulate face verification API call
      // In real implementation, you would send this to your backend
      await simulateFaceVerification(imageData);

      closeAlert();
      setVerificationStatus('success');
      successToast('Verifikasi wajah berhasil!');
      
      // Stop camera
      stopCamera();
      
      // Call success callback after a short delay
      setTimeout(() => {
        if (onVerificationSuccess) {
          onVerificationSuccess(imageData);
        }
      }, 1500);

    } catch (error) {
      closeAlert();
      setVerificationStatus('failed');
      errorToast('Verifikasi wajah gagal. Silakan coba lagi.');
      
      if (onVerificationFail) {
        onVerificationFail(error);
      }
    }
  };

  // Simulate face verification (replace with actual API call)
  const simulateFaceVerification = (imageData) => {
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
        // For demo purposes, we'll randomly succeed 90% of the time
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
          resolve({
            success: true,
            confidence: 0.85 + Math.random() * 0.1,
            message: 'Face verified successfully'
          });
        } else {
          reject({
            success: false,
            error: 'Face verification failed',
            message: 'Wajah tidak dikenali'
          });
        }
      }, 2000);
    });
  };

  const retryVerification = () => {
    setVerificationStatus('capturing');
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                {/* Face overlay guide */}
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
                <UserCheck className="h-12 w-12 mx-auto text-gray-400" />
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
                <p className="text-sm text-gray-500">
                  Pastikan wajah Anda berada dalam area yang ditandai
                </p>
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
                <p className="text-sm text-gray-500">
                  Wajah Anda telah terverifikasi
                </p>
              </div>
            )}

            {verificationStatus === 'failed' && (
              <div className="space-y-2">
                <XCircle className="h-12 w-12 mx-auto text-red-500" />
                <p className="text-red-600 font-medium">Verifikasi Gagal</p>
                <p className="text-sm text-gray-500">
                  Wajah tidak dikenali. Silakan coba lagi.
                </p>
              </div>
            )}
          </div>

          {/* Hidden canvas for capturing */}
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
                  <UserCheck className="h-4 w-4" />
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

            {verificationStatus === 'success' && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                Selesai
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-3 mt-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Tips Verifikasi:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Pastikan pencahayaan cukup</li>
              <li>• Hadap kamera secara langsung</li>
              <li>• Lepaskan kacamata hitam atau topi</li>
              <li>• Jaga ekspresi wajah netral</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceVerification;