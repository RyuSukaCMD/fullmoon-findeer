import { Router } from "express";
import { trackView } from "../analytics.js";

const router = Router();

// Public analytics endpoint: records a view.
// target = 'main'  -> main page
// target = <pageId> -> a custom page's id
router.post("/view", (req, res) => {
  const { session_id, target } = req.body || {};
  if (typeof target !== "string" || !target || !/^[a-z]+$|^[0-9a-f-]{36}$/i.test(target)) {
    return res.status(400).json({ error: "Invalid target" });
  }
  const result = trackView({ sessionId: session_id, target });
  res.json({ recorded: result.recorded });
});

export default router;
