import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  createdDate: { type: Date, default: Date.now, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  location: {
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
  },
  radius: { type: Number, default: 100, min: 1, max: 5000 },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  absentStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  active: { type: Boolean, default: true, required: true },
});

const Class = mongoose.model("Class", classSchema);
export default Class;
