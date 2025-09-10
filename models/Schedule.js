const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  date: { type: String, required: true },
  subject: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  day: {
    type: String,
    enum: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
    required: true,
  },
  room: { type: String },
  color: { type: String, default: "blue" },
  attendance: {
    type: String,
    enum: ["pending", "present", "absent"],
    default: "pending",
  },
  createdBy: String,
  notification: { type: Boolean, default: false },
  notificationTime: { type: Number, default: 15 },
  createdAt: { type: Date, default: Date.now },
});

const Schedule = mongoose.model("Schedule", scheduleSchema);
module.exports = Schedule;
