import { Router } from "express";
import bcrypt from "bcryptjs";
import { Article, Message, Pageview, Publication, User } from "../models.js";
import { clearSession, requireAdmin, revokeSession, setSession, signSession, verifyPassword, COOKIE } from "../auth.js";
import { clearLimit, limitStatus, recordLimit } from "../limit.js";
import { clientAddress, hashAddress } from "../security.js";
import { articleFrom, objectId, publicationFrom } from "../validate.js";

const router = Router();
const LOGIN_WINDOW = 10 * 60 * 1000;

function requireDesk(req, res, next) {
  requireAdmin(req, res, () => {
    if (!req.adminUser || req.adminUser.mustChangePassword !== false) {
      return res.status(403).json({ error: "Set a new password before using the desk." });
    }
    return next();
  });
}

function messageView(doc, { includeBody = false } = {}) {
  if (!doc) return null;
  const item = doc.toObject ? doc.toObject() : doc;
  return {
    _id: item._id,
    name: item.name,
    email: item.email,
    organisation: item.organisation || "",
    country: item.country || "",
    enquiry: item.enquiry,
    subject: item.subject,
    ...(includeBody ? { message: item.message } : {}),
    isRead: Boolean(item.isRead),
    createdAt: item.createdAt,
  };
}

router.post("/login", async (req, res, next) => {
  try {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!username || !password) return res.status(400).json({ error: "Enter a username and password." });
    if (username.length > 80 || password.length > 200) {
      return res.status(401).json({ error: "Those credentials were not recognised." });
    }
    const ipHash = hashAddress(clientAddress(req));
    const ipKey = `login:ip:${ipHash}`;
    const userKey = `login:user:${ipHash}:${username.toLowerCase()}`;
    const ipStatus = limitStatus(ipKey, { limit: 30, windowMs: LOGIN_WINDOW });
    const userStatus = limitStatus(userKey, { limit: 8, windowMs: LOGIN_WINDOW });
    if (ipStatus.limited || userStatus.limited) {
      res.setHeader("Retry-After", String((ipStatus.retryAfter || userStatus.retryAfter)));
      return res.status(429).json({ error: "Too many sign-in attempts. Wait a few minutes and try again." });
    }
    const user = await User.findOne({ username });
    const recognised = user && await bcrypt.compare(password, user.passwordHash);
    if (!recognised) {
      if (!user) await verifyPassword(password, "");
      recordLimit(ipKey, { windowMs: LOGIN_WINDOW });
      recordLimit(userKey, { windowMs: LOGIN_WINDOW });
      return res.status(401).json({ error: "Those credentials were not recognised." });
    }
    clearLimit(ipKey);
    clearLimit(userKey);
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();
    setSession(res, signSession(user));
    res.json({ username: user.username, mustChangePassword: user.mustChangePassword !== false });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    await revokeSession(req.cookies?.[COOKIE]);
    clearSession(res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAdmin, async (req, res, next) => {
  try {
    res.json({
      username: req.adminUser.username,
      mustChangePassword: req.adminUser.mustChangePassword !== false,
    });
  } catch (error) {
    next(error);
  }
});

const missingLink = {
  $and: [
    { $or: [{ url: "" }, { url: null }, { url: { $exists: false } }] },
    { $or: [{ doi: "" }, { doi: null }, { doi: { $exists: false } }] },
    { $or: [{ pdf: "" }, { pdf: null }, { pdf: { $exists: false } }] },
  ],
};

router.get("/stats", requireDesk, async (_req, res, next) => {
  try {
    const [publications, reviews, opinions, unread, views, messages, pages, missing, recent] = await Promise.all([
      Publication.countDocuments(),
      Article.countDocuments({ kind: "review" }),
      Article.countDocuments({ kind: "opinion" }),
      Message.countDocuments({ isRead: false }),
      Pageview.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
      Message.find().sort({ createdAt: -1 }).limit(5).select("name email enquiry subject isRead createdAt"),
      Pageview.aggregate([
        { $group: { _id: "$path", views: { $sum: "$views" } } },
        { $sort: { views: -1 } },
        { $limit: 5 },
      ]),
      Publication.find(missingLink).sort({ year: -1 }).limit(5).select("title year"),
      Publication.find().sort({ updatedAt: -1 }).limit(4).select("title year featured"),
    ]);
    res.json({
      publications,
      reviews,
      opinions,
      unread,
      views: views[0]?.total || 0,
      messages: messages.map((item) => messageView(item)),
      pages: pages.map((page) => ({ path: page._id, views: page.views })),
      missing,
      recent,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/publications", requireDesk, async (_req, res, next) => {
  try {
    res.json(await Publication.find().sort({ year: -1, title: 1 }).limit(2000));
  } catch (error) {
    next(error);
  }
});

router.post("/publications", requireDesk, async (req, res, next) => {
  try {
    const parsed = publicationFrom(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const item = await Publication.create(parsed.value);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put("/publications/:id", requireDesk, async (req, res, next) => {
  try {
    const id = objectId(req.params.id);
    if (!id) return res.status(400).json({ error: "That record could not be found." });
    const parsed = publicationFrom(req.body, { partial: true });
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const item = await Publication.findByIdAndUpdate(id, parsed.value, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: "Publication not found." });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete("/publications/:id", requireDesk, async (req, res, next) => {
  try {
    const id = objectId(req.params.id);
    if (!id) return res.status(400).json({ error: "That record could not be found." });
    const item = await Publication.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: "Publication not found." });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/articles", requireDesk, async (_req, res, next) => {
  try {
    res.json(await Article.find().sort({ date: -1 }).limit(2000));
  } catch (error) {
    next(error);
  }
});

router.post("/articles", requireDesk, async (req, res, next) => {
  try {
    const parsed = articleFrom(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const item = await Article.create(parsed.value);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put("/articles/:id", requireDesk, async (req, res, next) => {
  try {
    const id = objectId(req.params.id);
    if (!id) return res.status(400).json({ error: "That record could not be found." });
    const parsed = articleFrom(req.body, { partial: true });
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const item = await Article.findByIdAndUpdate(id, parsed.value, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: "Article not found." });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete("/articles/:id", requireDesk, async (req, res, next) => {
  try {
    const id = objectId(req.params.id);
    if (!id) return res.status(400).json({ error: "That record could not be found." });
    const item = await Article.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: "Article not found." });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/messages", requireDesk, async (_req, res, next) => {
  try {
    const items = await Message.find().sort({ createdAt: -1 }).limit(1000).select("-ipHash");
    res.json(items.map((item) => messageView(item, { includeBody: true })));
  } catch (error) {
    next(error);
  }
});

router.patch("/messages/:id/read", requireDesk, async (req, res, next) => {
  try {
    const id = objectId(req.params.id);
    if (!id) return res.status(400).json({ error: "That record could not be found." });
    const item = await Message.findByIdAndUpdate(id, { isRead: true }, { new: true }).select("-ipHash");
    if (!item) return res.status(404).json({ error: "Message not found." });
    res.json(messageView(item, { includeBody: true }));
  } catch (error) {
    next(error);
  }
});

router.delete("/messages/:id", requireDesk, async (req, res, next) => {
  try {
    const id = objectId(req.params.id);
    if (!id) return res.status(400).json({ error: "That record could not be found." });
    const item = await Message.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: "Message not found." });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/password", requireAdmin, async (req, res, next) => {
  try {
    const nextPassword = typeof req.body?.password === "string" ? req.body.password : "";
    const current = typeof req.body?.current === "string" ? req.body.current : "";
    if (nextPassword.trim().length < 10 || nextPassword.length > 200) {
      return res.status(400).json({ error: "Use at least 10 characters." });
    }
    const user = await User.findById(req.admin.id);
    if (!user) return res.status(401).json({ error: "Sign in required." });
    if (!user.mustChangePassword) {
      if (!current || !(await bcrypt.compare(current, user.passwordHash))) {
        return res.status(400).json({ error: "The current password is not correct." });
      }
    }
    if (await bcrypt.compare(nextPassword, user.passwordHash)) {
      return res.status(400).json({ error: "Choose a password different from the current one." });
    }
    user.passwordHash = await bcrypt.hash(nextPassword, 12);
    user.mustChangePassword = false;
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();
    setSession(res, signSession(user));
    res.json({ ok: true, mustChangePassword: false });
  } catch (error) {
    next(error);
  }
});

export default router;
