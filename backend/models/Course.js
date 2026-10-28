import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true, trim: true },
  courseCode: { type: String, required: true, unique: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true },
  radius: { type: Number, default: 100, min: 1, max: 5000 },
});

const Course = mongoose.model("Course", courseSchema);
export default Course;
