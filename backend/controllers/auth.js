import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import {
  logInBodyValidation,
  signUpBodyValidation,
} from "../utils/validationSchema.js";

const login = async (req, res) => {
  try {
    const { error } = logInBodyValidation(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res
        .status(401)
        .json({ error: true, message: "Invalid email or password" });

    const verifiedPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!verifiedPassword)
      return res
        .status(401)
        .json({ error: true, message: "Invalid email or password" });

    const token = await generateToken(user);

    res.status(200).json({
      error: false,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Logged in sucessfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

const signUp = async (req, res) => {
  try {
    const { error } = signUpBodyValidation(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message });

    const oldUser = await User.findOne({ email: req.body.email });
    if (oldUser)
      return res
        .status(409)
        .json({ error: true, message: "User with given email already exist" });

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    const user = await new User({ ...req.body, role: "student", password: hashPassword }).save();
    const token = await generateToken(user);

    res.status(201).json({
      error: false,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Account created sucessfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

export { login, signUp };

const generateToken = async (user) => {
  try {
    const payload = { _id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_PRIVATE_KEY, {
      expiresIn: "30d",
    });

    return Promise.resolve(token);
  } catch (err) {
    return Promise.reject(err);
  }
};
