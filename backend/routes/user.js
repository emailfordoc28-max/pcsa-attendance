import { Router } from "express";
import { getMe, updateMe } from "../controllers/user.js";

const router = Router();
router.get("/me", getMe);
router.put("/", updateMe);
export default router;
