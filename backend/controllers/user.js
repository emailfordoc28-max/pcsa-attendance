import User from "../models/User.js";

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name email role registrationNo");
    if (!user) return res.status(404).json({ error: true, message: "User not found" });
    res.json({ error: false, data: user, message: "Profile loaded" });
  } catch (err) {
    console.error("getMe failed:", err.message);
    res.status(500).json({ error: true, message: "Could not load profile" });
  }
};

const updateMe = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: true, message: "Name is required" });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true, select: "name email role registrationNo" }
    );
    if (!user) return res.status(404).json({ error: true, message: "User not found" });
    res.json({ error: false, data: user, message: "Profile updated" });
  } catch (err) {
    console.error("updateMe failed:", err.message);
    res.status(500).json({ error: true, message: "Could not update profile" });
  }
};

export { getMe, updateMe };
