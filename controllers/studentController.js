const Student = require('../models/student');

// Add Student
const addStudent = async (req, res) => {
  const { fullName, gender, phone, college, studentId, major, year, email } = req.body;
  const student = new Student({
    fullName,
    gender,
    phone,
    college,
    studentId,
    major,
    year,
    email,
    user_role: 'student',
  });

  try {
    await student.save();
    res.status(201).json({ message: "Student added successfully ✅", student });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all students
const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ message: "Student updated ✅", student });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ message: "Student deleted ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addStudent, getStudents, updateStudent, deleteStudent };
