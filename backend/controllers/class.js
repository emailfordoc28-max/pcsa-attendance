import Class from "../models/Class.js";
import Course from "../models/Course.js";

const failRole = (res, message) => res.status(403).json({ error: true, message });

const startClass = async (req, res) => {
  if (req.user.role !== "teacher") return failRole(res, "Only teachers can start a class");
  try {
    const { courseId, location } = req.body;
    const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
    if (!course || course.isActive === false) return res.status(404).json({ error: true, message: "Course not found or inactive" });
    if (!validLocation(location)) return res.status(400).json({ error: true, message: "A valid location is required to start class" });
    const active = await Class.findOne({ courseId, active: true });
    if (active) return res.status(409).json({ error: true, message: "This course already has an active class" });
    const radius = Number(req.body.radius || course.radius || 100);
    if (!Number.isFinite(radius) || radius < 1 || radius > 5000) return res.status(400).json({ error: true, message: "Radius must be between 1 and 5000 metres" });
    const session = await new Class({ courseId, location, radius }).save();
    res.status(201).json({ error: false, data: session, message: "Class started successfully" });
  } catch (err) {
    console.error("startClass failed:", err.message);
    res.status(500).json({ error: true, message: "Could not start class" });
  }
};

const dismissClass = async (req, res) => {
  if (req.user.role !== "teacher") return failRole(res, "Only teachers can end a class");
  try {
    const course = await Course.findOne({ _id: req.body.courseId, teacher: req.user._id });
    if (!course) return res.status(404).json({ error: true, message: "Course not found" });
    const session = await Class.findOneAndUpdate({ courseId: course._id, active: true }, { active: false }, { new: true });
    if (!session) return res.status(404).json({ error: true, message: "No active class found" });
    res.json({ error: false, data: session, message: "Class ended successfully" });
  } catch (err) {
    console.error("dismissClass failed:", err.message);
    res.status(500).json({ error: true, message: "Could not end class" });
  }
};

const markAttendance = async (req, res) => {
  if (req.user.role !== "student") return failRole(res, "Only students can mark attendance");
  try {
    const { courseId, location } = req.body;
    if (!validLocation(location)) return res.status(400).json({ error: true, message: "Allow location access and try again" });
    const course = await Course.findOne({ _id: courseId, students: req.user._id });
    if (!course || course.isActive === false) return res.status(403).json({ error: true, message: "Enroll in an active course before marking attendance" });
    const session = await Class.findOne({ courseId, active: true });
    if (!session) return res.status(404).json({ error: true, message: "There is no active class for this course" });
    if (session.students.some((studentId) => String(studentId) === String(req.user._id))) {
      return res.status(409).json({ error: true, message: "Attendance has already been marked for this class" });
    }
    const distance = distanceInMeters(location, session.location);
    if (distance > session.radius) {
      return res.status(400).json({ error: true, message: "You are outside the class attendance radius", distanceMeters: Math.round(distance), radiusMeters: session.radius });
    }
    session.students.addToSet(req.user._id);
    session.absentStudents.pull(req.user._id);
    await session.save();
    res.json({ error: false, data: { classId: session._id, distanceMeters: Math.round(distance) }, message: "Attendance marked successfully" });
  } catch (err) {
    console.error("markAttendance failed:", err.message);
    res.status(500).json({ error: true, message: "Could not mark attendance" });
  }
};

const getClassesByCourseId = async (req, res) => {
  try {
    const courseId = req.params.courseId || req.query.courseId;
    if (!isObjectId(courseId)) {
      return res.status(400).json({ error: true, message: "A valid courseId is required" });
    }
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: true, message: "Course not found" });
    const isTeacher = String(course.teacher) === String(req.user._id) && req.user.role === "teacher";
    const isStudent = course.students.some((id) => String(id) === String(req.user._id)) && req.user.role === "student";
    if (!isTeacher && !isStudent) return failRole(res, "You do not have access to this course");
    const sessions = await Class.find({ courseId }).sort({ createdDate: -1 }).populate("students", "name email registrationNo");
    res.json({ error: false, data: sessions, message: "Class sessions found" });
  } catch (err) {
    console.error("getClassesByCourseId failed:", err.message);
    res.status(500).json({ error: true, message: "Could not load class sessions" });
  }
};

const getClassById = async (req, res) => {
  try {
    const classId = req.params.classId || req.query.classId;
    if (!isObjectId(classId)) {
      return res.status(400).json({ error: true, message: "A valid classId is required" });
    }
    const session = await Class.findById(classId).populate("students", "name email registrationNo");
    if (!session) return res.status(404).json({ error: true, message: "Class session not found" });
    const course = await Course.findById(session.courseId);
    if (!course) return res.status(404).json({ error: true, message: "Course not found" });
    const allowed = req.user.role === "teacher"
      ? String(course.teacher) === String(req.user._id)
      : course.students.some((id) => String(id) === String(req.user._id));
    if (!allowed) return failRole(res, "You do not have access to this class");
    res.json({ error: false, data: session, message: "Class session found" });
  } catch (err) {
    console.error("getClassById failed:", err.message);
    res.status(500).json({ error: true, message: "Could not load class session" });
  }
};

const getClassStudents = async (req, res) => {
  try {
    const session = await Class.findById(req.query.classId);
    if (!session) return res.status(404).json({ error: true, message: "Class session not found" });
    const course = await Course.findById(session.courseId).populate("students", "name email registrationNo");
    if (!course || req.user.role !== "teacher" || String(course.teacher) !== String(req.user._id)) {
      return failRole(res, "Only the course teacher can view the full attendance list");
    }
    const present = new Set(session.students.map(String));
    const data = course.students.map((student) => ({ ...student.toObject(), present: present.has(String(student._id)) }));
    res.json({ error: false, data, message: "Attendance list found" });
  } catch (err) {
    console.error("getClassStudents failed:", err.message);
    res.status(500).json({ error: true, message: "Could not load attendance list" });
  }
};

const updateClassAttendance = async (req, res) => {
  if (req.user.role !== "teacher") return failRole(res, "Only teachers can update attendance");
  try {
    const session = await Class.findById(req.params.classId);
    if (!session) return res.status(404).json({ error: true, message: "Class session not found" });
    const course = await Course.findOne({ _id: session.courseId, teacher: req.user._id });
    if (!course) return failRole(res, "You do not own this course");
    for (const record of req.body.students || []) {
      const studentId = record._id;
      const enrolled = course.students.some((id) => String(id) === String(studentId));
      if (!enrolled) continue;
      if (record.present) {
        session.students.addToSet(studentId);
        session.absentStudents.pull(studentId);
      } else {
        session.students.pull(studentId);
        session.absentStudents.addToSet(studentId);
      }
    }
    await session.save();
    res.json({ error: false, message: "Attendance updated" });
  } catch (err) {
    console.error("updateClassAttendance failed:", err.message);
    res.status(500).json({ error: true, message: "Could not update attendance" });
  }
};

const deleteClass = async (req, res) => {
  if (req.user.role !== "teacher") return failRole(res, "Only teachers can delete class sessions");
  try {
    const session = await Class.findById(req.params.classId);
    if (!session) return res.status(404).json({ error: true, message: "Class session not found" });
    const ownsCourse = await Course.exists({ _id: session.courseId, teacher: req.user._id });
    if (!ownsCourse) return failRole(res, "You do not own this course");
    await session.deleteOne();
    res.json({ error: false, message: "Class session deleted" });
  } catch (err) {
    console.error("deleteClass failed:", err.message);
    res.status(500).json({ error: true, message: "Could not delete class session" });
  }
};

const validLocation = (location) => Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude)) && Math.abs(Number(location.latitude)) <= 90 && Math.abs(Number(location.longitude)) <= 180;
const isObjectId = (value) => typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
const distanceInMeters = (from, to) => {
  const earthRadius = 6371000;
  const rad = (degrees) => (degrees * Math.PI) / 180;
  const lat1 = rad(Number(from.latitude));
  const lat2 = rad(Number(to.latitude));
  const dLat = lat2 - lat1;
  const dLon = rad(Number(to.longitude) - Number(from.longitude));
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export { startClass, dismissClass, markAttendance, getClassesByCourseId, getClassById, getClassStudents, updateClassAttendance, deleteClass };
