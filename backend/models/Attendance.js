const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    checkIn: {
      timestamp: {
        type: Date,
        default: null,
      },
      latitude: Number,
      longitude: Number,
    },
    checkOut: {
      timestamp: {
        type: Date,
        default: null,
      },
      latitude: Number,
      longitude: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Pastikan index unique ada
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
