import { Router } from "express";

import { login, signUp } from "../controllers/auth.js";

const router = Router();

router.post("/login", login);
router.post("/signUp", signUp);

export default router;
