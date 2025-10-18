const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: 'PT. Perusahaan Contoh'
    },
    workingHours: {
        start: {
            type: String,
            default: '09:00'
        },
        end: {
            type: String,
            default: '17:00'
        }
    },
    attendanceRules: {
        maxCheckInTime: {
            type: String,
            default: '10:00'
        },
        minWorkingHours: {
            type: Number,
            default: 8
        },
        allowRemote: {
            type: Boolean,
            default: false
        }
    },
    officeLocation: {
        latitude: {
            type: Number,
            default: -6.2088
        },
        longitude: {
            type: Number,
            default: 106.8456
        },
        radius: {
            type: Number,
            default: 100
        },
        address: {
            type: String,
            default: 'Jakarta, Indonesia'
        }
    }
}, {
    timestamps: true
});

// Ensure only one settings document exists
settingsSchema.pre('save', async function(next) {
    const Settings = mongoose.model('Settings');
    const existing = await Settings.findOne();
    if (existing && existing._id.toString() !== this._id.toString()) {
        const error = new Error('Only one settings document is allowed');
        return next(error);
    }
    next();
});

module.exports = mongoose.model('Settings', settingsSchema);
