const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    checkIn: {
        timestamp: {
            type: Date,
            default: null
        },
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        },
        faceImage: {
            type: String, // Base64 image
            default: null
        },
        verificationMethod: {
            type: String,
            enum: ['face', 'location', 'manual'],
            default: 'location'
        },
        confidence: {
            type: Number, // Confidence score for face verification
            default: null
        }
    },
    checkOut: {
        timestamp: {
            type: Date,
            default: null
        },
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        },
        faceImage: {
            type: String, // Base64 image
            default: null
        },
        verificationMethod: {
            type: String,
            enum: ['face', 'location', 'manual'],
            default: 'location'
        },
        confidence: {
            type: Number, // Confidence score for face verification
            default: null
        }
    }
}, {
    timestamps: true
});

// Compound index untuk mencegah duplikasi check-in harian
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);