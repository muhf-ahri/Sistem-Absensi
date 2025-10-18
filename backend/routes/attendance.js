const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

const router = express.Router();

// Face Verification Helper Function
const verifyFace = async (faceImage, userId) => {
    try {
        // Simulasi verifikasi wajah
        // DI PRODUCTION, GANTI DENGAN API FACE VERIFICATION YANG SEBENARNYA
        // Contoh: FaceIO, Azure Face API, AWS Rekognition, dll.
        
        // Untuk demo, kita simulasi dengan success rate 90%
        const isSuccess = Math.random() > 0.1;
        const confidence = 0.85 + Math.random() * 0.1; // 85-95% confidence
        
        if (isSuccess) {
            return {
                success: true,
                confidence: confidence,
                message: 'Face verification successful'
            };
        } else {
            return {
                success: false,
                confidence: 0.3 + Math.random() * 0.2, // 30-50% confidence untuk failed
                message: 'Face verification failed - face not recognized'
            };
        }
    } catch (error) {
        throw new Error('Face verification service error: ' + error.message);
    }
};

// Check-in dengan Face Verification
router.post('/check-in', async (req, res) => {
    try {
        const { 
            userId, 
            latitude, 
            longitude, 
            timestamp, 
            faceImage, 
            verificationMethod = 'location' 
        } = req.body;
        
        const today = new Date().toISOString().split('T')[0];

        console.log('=== CHECK-IN START ===', { 
            userId, 
            today, 
            verificationMethod,
            hasFaceImage: !!faceImage 
        });

        // Validasi wajib untuk face verification
        if (verificationMethod === 'face' && !faceImage) {
            return res.status(400).json({ 
                error: 'Face image required for face verification' 
            });
        }

        // Cek apakah sudah check-in hari ini
        const existing = await Attendance.findOne({ 
            userId, 
            date: today 
        });

        if (existing && existing.checkIn && existing.checkIn.timestamp) {
            console.log('❌ Already checked in at:', existing.checkIn.timestamp);
            return res.status(400).json({ error: 'Anda sudah check-in hari ini' });
        }

        // Face Verification Process
        let faceVerificationResult = null;
        if (verificationMethod === 'face' && faceImage) {
            console.log('🔍 Starting face verification...');
            
            faceVerificationResult = await verifyFace(faceImage, userId);
            
            if (!faceVerificationResult.success) {
                console.log('❌ Face verification failed:', faceVerificationResult.message);
                return res.status(400).json({ 
                    error: 'Verifikasi wajah gagal: ' + faceVerificationResult.message,
                    confidence: faceVerificationResult.confidence
                });
            }
            
            console.log('✅ Face verification success, confidence:', faceVerificationResult.confidence);
        }

        // Prepare check-in data
        const checkInData = {
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            latitude: latitude || null,
            longitude: longitude || null,
            verificationMethod: verificationMethod
        };

        // Add face verification data if available
        if (verificationMethod === 'face') {
            checkInData.faceImage = faceImage;
            checkInData.confidence = faceVerificationResult.confidence;
        }

        // Jika record sudah ada tapi belum check-in (update)
        if (existing) {
            console.log('🔄 Updating existing record with check-in');
            existing.checkIn = checkInData;
            await existing.save();
        } else {
            // Buat record baru
            console.log('🆕 Creating new record with check-in');
            const newAttendance = new Attendance({
                userId,
                date: today,
                checkIn: checkInData
            });
            await newAttendance.save();
        }

        // Ambil data terbaru untuk response
        const updatedRecord = await Attendance.findOne({ userId, date: today });
        
        const response = {
            message: 'Check-in berhasil',
            verificationMethod: verificationMethod,
            confidence: faceVerificationResult?.confidence || null,
            checkIn: updatedRecord.checkIn
        };

        console.log('✅ Check-in success:', response);
        res.json(response);

    } catch (error) {
        console.error('💥 CHECK-IN ERROR:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Anda sudah check-in hari ini' });
        }
        
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Check-out dengan Face Verification
router.post('/check-out', async (req, res) => {
    try {
        const { 
            userId, 
            latitude, 
            longitude, 
            timestamp, 
            faceImage, 
            verificationMethod = 'location' 
        } = req.body;
        
        const today = new Date().toISOString().split('T')[0];

        console.log('=== CHECK-OUT START ===', { 
            userId, 
            today, 
            verificationMethod,
            hasFaceImage: !!faceImage 
        });

        // Validasi wajib untuk face verification
        if (verificationMethod === 'face' && !faceImage) {
            return res.status(400).json({ 
                error: 'Face image required for face verification' 
            });
        }

        // Cari record hari ini
        const attendance = await Attendance.findOne({ userId, date: today });
        
        if (!attendance) {
            console.log('❌ No attendance record found');
            return res.status(400).json({ error: 'Belum check-in hari ini' });
        }

        if (!attendance.checkIn || !attendance.checkIn.timestamp) {
            console.log('❌ No check-in data found');
            return res.status(400).json({ error: 'Belum check-in hari ini' });
        }

        // Cek jika sudah check-out
        if (attendance.checkOut && attendance.checkOut.timestamp) {
            console.log('❌ Already checked out at:', attendance.checkOut.timestamp);
            return res.status(400).json({ error: 'Anda sudah check-out hari ini' });
        }

        // Face Verification Process untuk check-out
        let faceVerificationResult = null;
        if (verificationMethod === 'face' && faceImage) {
            console.log('🔍 Starting face verification for check-out...');
            
            faceVerificationResult = await verifyFace(faceImage, userId);
            
            if (!faceVerificationResult.success) {
                console.log('❌ Face verification failed:', faceVerificationResult.message);
                return res.status(400).json({ 
                    error: 'Verifikasi wajah gagal: ' + faceVerificationResult.message,
                    confidence: faceVerificationResult.confidence
                });
            }
            
            console.log('✅ Face verification success, confidence:', faceVerificationResult.confidence);
        }

        // Prepare check-out data
        const checkOutData = {
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            latitude: latitude || null,
            longitude: longitude || null,
            verificationMethod: verificationMethod
        };

        // Add face verification data if available
        if (verificationMethod === 'face') {
            checkOutData.faceImage = faceImage;
            checkOutData.confidence = faceVerificationResult.confidence;
        }

        // Update check-out data
        attendance.checkOut = checkOutData;
        await attendance.save();

        // Response dengan data lengkap
        const response = {
            message: 'Check-out berhasil',
            verificationMethod: verificationMethod,
            confidence: faceVerificationResult?.confidence || null,
            checkOut: attendance.checkOut
        };

        console.log('✅ Check-out success:', response);
        res.json(response);

    } catch (error) {
        console.error('💥 CHECK-OUT ERROR:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get today's attendance - IMPROVED dengan face data
router.get('/today/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        console.log('=== TODAY REQUEST ===', { userId, today });

        const attendance = await Attendance.findOne({ userId, date: today });
        
        // Format response yang konsisten dengan face data
        const response = {
            checkIn: attendance?.checkIn || null,
            checkOut: attendance?.checkOut || null,
            date: today,
            userId: userId
        };

        // Hapus base64 image dari response untuk mengurangi size
        if (response.checkIn && response.checkIn.faceImage) {
            response.checkIn.hasFaceImage = true;
            delete response.checkIn.faceImage; // Remove large base64 data
        }
        
        if (response.checkOut && response.checkOut.faceImage) {
            response.checkOut.hasFaceImage = true;
            delete response.checkOut.faceImage; // Remove large base64 data
        }

        console.log('📊 Today response:', {
            hasCheckIn: !!response.checkIn,
            hasCheckOut: !!response.checkOut,
            verificationMethod: response.checkIn?.verificationMethod
        });
        
        res.json(response);

    } catch (error) {
        console.error('💥 TODAY ERROR:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get attendance history dengan filter face verification
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate, verificationMethod } = req.query;

        let query = { userId };
        
        // Filter by date range
        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        }

        // Filter by verification method
        if (verificationMethod) {
            query.$or = [
                { 'checkIn.verificationMethod': verificationMethod },
                { 'checkOut.verificationMethod': verificationMethod }
            ];
        }

        const userAttendance = await Attendance.find(query).sort({ date: -1 });

        // Clean up response - remove large base64 data
        const cleanAttendance = userAttendance.map(record => ({
            _id: record._id,
            userId: record.userId,
            date: record.date,
            checkIn: record.checkIn ? {
                timestamp: record.checkIn.timestamp,
                latitude: record.checkIn.latitude,
                longitude: record.checkIn.longitude,
                verificationMethod: record.checkIn.verificationMethod,
                confidence: record.checkIn.confidence,
                hasFaceImage: !!record.checkIn.faceImage
            } : null,
            checkOut: record.checkOut ? {
                timestamp: record.checkOut.timestamp,
                latitude: record.checkOut.latitude,
                longitude: record.checkOut.longitude,
                verificationMethod: record.checkOut.verificationMethod,
                confidence: record.checkOut.confidence,
                hasFaceImage: !!record.checkOut.faceImage
            } : null
        }));

        res.json(cleanAttendance);
    } catch (error) {
        console.error('💥 HISTORY ERROR:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get face verification stats
router.get('/face-stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const stats = await Attendance.aggregate([
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            {
                $facet: {
                    totalCheckIns: [
                        { $match: { 'checkIn.timestamp': { $exists: true } } },
                        { $count: 'count' }
                    ],
                    faceCheckIns: [
                        { $match: { 'checkIn.verificationMethod': 'face' } },
                        { $count: 'count' }
                    ],
                    totalCheckOuts: [
                        { $match: { 'checkOut.timestamp': { $exists: true } } },
                        { $count: 'count' }
                    ],
                    faceCheckOuts: [
                        { $match: { 'checkOut.verificationMethod': 'face' } },
                        { $count: 'count' }
                    ],
                    averageConfidence: [
                        {
                            $group: {
                                _id: null,
                                avgCheckInConfidence: { $avg: '$checkIn.confidence' },
                                avgCheckOutConfidence: { $avg: '$checkOut.confidence' }
                            }
                        }
                    ]
                }
            }
        ]);

        const result = {
            totalCheckIns: stats[0]?.totalCheckIns[0]?.count || 0,
            faceCheckIns: stats[0]?.faceCheckIns[0]?.count || 0,
            totalCheckOuts: stats[0]?.totalCheckOuts[0]?.count || 0,
            faceCheckOuts: stats[0]?.faceCheckOuts[0]?.count || 0,
            faceCheckInRate: stats[0]?.totalCheckIns[0]?.count ? 
                (stats[0].faceCheckIns[0].count / stats[0].totalCheckIns[0].count * 100).toFixed(1) : 0,
            faceCheckOutRate: stats[0]?.totalCheckOuts[0]?.count ? 
                (stats[0].faceCheckOuts[0].count / stats[0].totalCheckOuts[0].count * 100).toFixed(1) : 0,
            averageConfidence: {
                checkIn: stats[0]?.averageConfidence[0]?.avgCheckInConfidence?.toFixed(2) || 0,
                checkOut: stats[0]?.averageConfidence[0]?.avgCheckOutConfidence?.toFixed(2) || 0
            }
        };

        res.json(result);
    } catch (error) {
        console.error('💥 FACE STATS ERROR:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all attendance (for admin) dengan face verification info
router.get('/all', async (req, res) => {
    try {
        const { startDate, endDate, verificationMethod } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (verificationMethod) {
            query.$or = [
                { 'checkIn.verificationMethod': verificationMethod },
                { 'checkOut.verificationMethod': verificationMethod }
            ];
        }

        const attendanceRecords = await Attendance.find(query)
            .populate('userId', 'name email position')
            .sort({ date: -1 });

        const attendanceWithUserInfo = attendanceRecords.map(record => ({
            id: record._id,
            userId: record.userId._id,
            date: record.date,
            checkIn: record.checkIn ? {
                timestamp: record.checkIn.timestamp,
                latitude: record.checkIn.latitude,
                longitude: record.checkIn.longitude,
                verificationMethod: record.checkIn.verificationMethod,
                confidence: record.checkIn.confidence,
                hasFaceImage: !!record.checkIn.faceImage
            } : null,
            checkOut: record.checkOut ? {
                timestamp: record.checkOut.timestamp,
                latitude: record.checkOut.latitude,
                longitude: record.checkOut.longitude,
                verificationMethod: record.checkOut.verificationMethod,
                confidence: record.checkOut.confidence,
                hasFaceImage: !!record.checkOut.faceImage
            } : null,
            userName: record.userId.name,
            userEmail: record.userId.email,
            userPosition: record.userId.position
        }));

        res.json(attendanceWithUserInfo);
    } catch (error) {
        console.error('💥 ALL ATTENDANCE ERROR:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;