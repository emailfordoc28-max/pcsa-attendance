import { Router } from "express";
import {
  deleteClass,
  dismissClass,
  getClassById,
  getClassStudents,
  getClassesByCourseId,
  markAttendance,
  startClass,
  updateClassAttendance,
} from "../controllers/class.js";

const router = Router();
router.route("/").get(getClassesByCourseId).post(startClass).put((req, res, next) => {
  if (req.user?.role === "teacher") return dismissClass(req, res, next);
  return markAttendance(req, res, next);
});
router.get("/students", getClassStudents);
// Original route names must come before /:classId so Express does not treat them as IDs.
router.post("/startClass", startClass);
router.post("/dismissClass", dismissClass);
router.post("/markAttendance", markAttendance);
router.get("/getClassesByCourseId", getClassesByCourseId);
router.get("/getClassById", getClassById);
// Legacy clients request /class/course (or /class/course/:courseId).
// These static paths must precede /:classId, or "course" is cast as an ObjectId.
router.get("/course", getClassesByCourseId);
router.get("/course/:courseId", getClassesByCourseId);
router.get("/:classId", getClassById);
router.put("/:classId", updateClassAttendance);
router.delete("/:classId", deleteClass);
export default router;
