const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

const router = express.Router();

// Check-in - SIMPLE & CLEAR
router.post('/check-in', async (req, res) => {
    try {
        const { userId, latitude, longitude, timestamp } = req.body;
        const today = new Date().toISOString().split('T')[0];

        console.log('=== CHECK-IN START ===', { userId, today });

        // Cek apakah sudah check-in hari ini
        const existing = await Attendance.findOne({ 
            userId, 
            date: today 
        });

        if (existing && existing.checkIn && existing.checkIn.timestamp) {
            console.log('❌ Already checked in at:', existing.checkIn.timestamp);
            return res.status(400).json({ error: 'Anda sudah check-in hari ini' });
        }

        // Jika record sudah ada tapi belum check-in (update)
        if (existing) {
            console.log('🔄 Updating existing record with check-in');
            existing.checkIn = {
                timestamp: timestamp ? new Date(timestamp) : new Date(),
                latitude: latitude || null,
                longitude: longitude || null
            };
            await existing.save();
        } else {
            // Buat record baru
            console.log('🆕 Creating new record with check-in');
            const newAttendance = new Attendance({
                userId,
                date: today,
                checkIn: {
                    timestamp: timestamp ? new Date(timestamp) : new Date(),
                    latitude: latitude || null,
                    longitude: longitude || null
                }
                // checkOut tidak diisi sama sekali
            });
            await newAttendance.save();
        }

        // Ambil data terbaru untuk verifikasi
        const updatedRecord = await Attendance.findOne({ userId, date: today });
        console.log('✅ Check-in success:', {
            checkIn: updatedRecord.checkIn,
            checkOut: updatedRecord.checkOut
        });

        res.json({ message: 'Check-in berhasil' });

    } catch (error) {
        console.error('💥 CHECK-IN ERROR:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Anda sudah check-in hari ini' });
        }
        
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Check-out - SIMPLE & CLEAR
router.post('/check-out', async (req, res) => {
    try {
        const { userId, latitude, longitude, timestamp } = req.body;
        const today = new Date().toISOString().split('T')[0];

        console.log('=== CHECK-OUT START ===', { userId, today });

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

        // TAMBAH CHECK-OUT dengan data lengkap
        attendance.checkOut = {
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            latitude: latitude || null,
            longitude: longitude || null
        };

        await attendance.save();

        // Verifikasi data akhir
        const finalRecord = await Attendance.findOne({ userId, date: today });
        console.log('✅ Check-out success:', {
            checkIn: finalRecord.checkIn,
            checkOut: finalRecord.checkOut
        });

        res.json({ message: 'Check-out berhasil' });

    } catch (error) {
        console.error('💥 CHECK-OUT ERROR:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get today's attendance - IMPROVED
router.get('/today/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        console.log('=== TODAY REQUEST ===', { userId, today });

        const attendance = await Attendance.findOne({ userId, date: today });
        
        // Format response yang konsisten
        const response = {
            checkIn: attendance?.checkIn || null,
            checkOut: attendance?.checkOut || null,
            date: today,
            userId: userId
        };

        console.log('📊 Today response:', response);
        res.json(response);

    } catch (error) {
        console.error('💥 TODAY ERROR:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get attendance history
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        let query = { userId };
        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        }

        const userAttendance = await Attendance.find(query).sort({ date: -1 });
        res.json(userAttendance);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all attendance (for admin)
router.get('/all', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendanceRecords = await Attendance.find(query)
            .populate('userId', 'name email position')
            .sort({ date: -1 });

        const attendanceWithUserInfo = attendanceRecords.map(record => ({
            id: record._id,
            userId: record.userId._id,
            date: record.date,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            userName: record.userId.name,
            userEmail: record.userId.email,
            userPosition: record.userId.position
        }));

        res.json(attendanceWithUserInfo);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;