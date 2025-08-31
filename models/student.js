const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true },
    college: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    major: { type: String, required: true },
    year: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
