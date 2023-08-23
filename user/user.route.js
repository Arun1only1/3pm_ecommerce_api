import express from "express";
import { registerUser, loginUser } from "./user.service.js";

const router = express.Router();

// register user
router.post("/user/register", registerUser);

// login user
router.post("/user/login", loginUser);

export default router;
