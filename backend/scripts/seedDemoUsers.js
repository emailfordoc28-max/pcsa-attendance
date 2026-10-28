import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("Demo accounts may only be created outside production");
}
if (!process.env.MONGO_URL) throw new Error("MONGO_URL is missing from the backend .env file");

const demoUsers = [
  { name: "Teacher One", email: "teacher1@example.com", password: "Teacher123!", role: "teacher" },
  { name: "Teacher Two", email: "teacher2@example.com", password: "Teacher123!", role: "teacher" },
  { name: "Student One", email: "student1@example.com", password: "Student123!", role: "student" },
  { name: "Student Two", email: "student2@example.com", password: "Student123!", role: "student" },
];

try {
  await mongoose.connect(process.env.MONGO_URL);
  const saltRounds = Number(process.env.SALT) || 10;
  for (const user of demoUsers) {
    const password = await bcrypt.hash(user.password, saltRounds);
    await User.updateOne(
      { email: user.email },
      { $set: { name: user.name, role: user.role, password } },
      { upsert: true }
    );
  }
  console.log("Demo accounts ready:");
  for (const { email, password } of demoUsers) console.log(`${email} / ${password}`);
} finally {
  await mongoose.disconnect();
}
