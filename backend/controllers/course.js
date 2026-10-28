import Course from "../models/Course.js";
import Class from "../models/Class.js";

const isTeacher = (req, res) => {
  if (req.user?.role === "teacher") return true;
  res.status(403).json({ error: true, message: "Only teachers can do that" });
  return false;
};

const getCourses = async (req, res) => {
  try {
    const query = req.user.role === "teacher"
      ? { teacher: req.user._id }
      : { students: req.user._id };
    const courses = await Course.find(query).populate("students", "name email registrationNo");
    const activeClasses = await Class.find({
      courseId: { $in: courses.map((course) => course._id) },
      active: true,
    }).select("courseId");
    const activeCourseIds = new Set(activeClasses.map((item) => String(item.courseId)));
    res.status(200).json({
      error: false,
      data: courses.map((course) => {
        const item = course.toObject();
        return {
          ...item,
          isActive: item.isActive !== false,
          radius: item.radius || 100,
          activeClass: activeCourseIds.has(String(course._id)),
        };
      }),
      message: "Courses found",
    });
  } catch (err) {
    console.error("getCourses failed:", err.message);
    res.status(500).json({ error: true, message: "Could not load courses" });
  }
};

const createCourse = async (req, res) => {
  if (!isTeacher(req, res)) return;
  try {
    const courseName = String(req.body.courseName || "").trim();
    if (!courseName) return res.status(400).json({ error: true, message: "Course name is required" });
    const radius = Number(req.body.radius || 100);
    if (!Number.isFinite(radius) || radius < 1 || radius > 5000) {
      return res.status(400).json({ error: true, message: "Radius must be between 1 and 5000 metres" });
    }
    const course = await new Course({
      courseName,
      courseCode: generateCourseCode(6),
      teacher: req.user._id,
      radius,
    }).save();
    res.status(201).json({ error: false, data: course, message: "Course created successfully" });
  } catch (err) {
    console.error("createCourse failed:", err.message);
    res.status(500).json({ error: true, message: "Could not create course" });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate("students", "name email registrationNo");
    if (!course) return res.status(404).json({ error: true, message: "Course not found" });
    const allowed = req.user.role === "teacher"
      ? String(course.teacher) === String(req.user._id)
      : course.students.some((student) => String(student._id) === String(req.user._id));
    if (!allowed) return res.status(403).json({ error: true, message: "You do not have access to this course" });
    const activeClass = await Class.exists({ courseId: course._id, active: true });
    const item = course.toObject();
    res.json({ error: false, data: { ...item, isActive: item.isActive !== false, radius: item.radius || 100, activeClass: Boolean(activeClass) }, message: "Course found" });
  } catch (err) {
    console.error("getCourseById failed:", err.message);
    res.status(500).json({ error: true, message: "Could not load course" });
  }
};

const enrollCourse = async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ error: true, message: "Only students can enroll in courses" });
  try {
    const courseCode = String(req.body.courseCode || "").trim();
    const course = await Course.findOne({ courseCode });
    if (!course || course.isActive === false) return res.status(404).json({ error: true, message: "Course not found or inactive" });
    if (course.students.some((studentId) => String(studentId) === String(req.user._id))) {
      return res.status(409).json({ error: true, message: "You are already enrolled in this course" });
    }
    course.students.addToSet(req.user._id);
    await course.save();
    res.status(200).json({ error: false, data: course, message: "Course enrollment successful" });
  } catch (err) {
    console.error("enrollCourse failed:", err.message);
    res.status(500).json({ error: true, message: "Could not enroll in course" });
  }
};

const updateCourseOrLeave = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: true, message: "Course not found" });
    if (req.user.role === "student") {
      course.students.pull(req.user._id);
      await course.save();
      return res.json({ error: false, message: "You left the course" });
    }
    if (!isTeacher(req, res)) return;
    if (String(course.teacher) !== String(req.user._id)) return res.status(403).json({ error: true, message: "You do not own this course" });
    if (typeof req.body.courseName === "string" && req.body.courseName.trim()) course.courseName = req.body.courseName.trim();
    if (typeof req.body.toggle === "boolean") course.isActive = !req.body.toggle;
    if (typeof req.body.isActive === "boolean") course.isActive = req.body.isActive;
    await course.save();
    res.json({ error: false, data: course, message: "Course updated" });
  } catch (err) {
    console.error("updateCourseOrLeave failed:", err.message);
    res.status(500).json({ error: true, message: "Could not update course" });
  }
};

const deleteCourse = async (req, res) => {
  if (!isTeacher(req, res)) return;
  try {
    const course = await Course.findOne({ _id: req.params.courseId, teacher: req.user._id });
    if (!course) return res.status(404).json({ error: true, message: "Course not found" });
    await Promise.all([course.deleteOne(), Class.deleteMany({ courseId: course._id })]);
    res.json({ error: false, message: "Course and its class records deleted" });
  } catch (err) {
    console.error("deleteCourse failed:", err.message);
    res.status(500).json({ error: true, message: "Could not delete course" });
  }
};

const sendAttendance = async (_req, res) => res.status(501).json({
  error: true,
  message: "Email delivery is not configured. Attendance records remain available in Class Data.",
});

const generateCourseCode = (length) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export { createCourse, getCourses, enrollCourse, getCourseById, updateCourseOrLeave, deleteCourse, sendAttendance };
