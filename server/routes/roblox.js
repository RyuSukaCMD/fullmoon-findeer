import { Router } from "express";
import { getAvatars, cachedAvatarCount } from "../roblox.js";

const router = Router();

// GET /api/roblox/avatars?count=N  ->  { avatars: [{id, name, avatarUrl}], cached }
router.get("/avatars", async (req, res) => {
  const count = parseInt(req.query.count, 10) || 12;
  try {
    const avatars = await getAvatars(count);
    res.json({ avatars, cached: cachedAvatarCount() });
  } catch (err) {
    console.error("[roblox] avatar error", err);
    res.status(502).json({ avatars: [], error: "Could not reach the Roblox avatar API" });
  }
});

export default router;
