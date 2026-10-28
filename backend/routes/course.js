import { Router } from "express";
import {
  createCourse,
  deleteCourse,
  enrollCourse,
  getCourseById,
  getCourses,
  sendAttendance,
  updateCourseOrLeave,
} from "../controllers/course.js";

const router = Router();
router.route("/").get(getCourses).post(createCourse);
router.post("/enroll", enrollCourse);
router.post("/attendance", sendAttendance);
// Original routes stay available; keep static paths ahead of /:courseId.
router.post("/createCourse", createCourse);
router.get("/getCourses", getCourses);
router.post("/enrollCourse", enrollCourse);
router.get("/:courseId", getCourseById);
router.put("/:courseId", updateCourseOrLeave);
router.delete("/:courseId", deleteCourse);
export default router;
