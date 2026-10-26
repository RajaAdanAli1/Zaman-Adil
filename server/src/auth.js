import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./models.js";

export const COOKIE = "za_session";
export const DEV_SECRET = "zamanadil-dev-secret-change-me";
const DUMMY_HASH = bcrypt.hashSync(`invalid-${crypto.randomBytes(8).toString("hex")}`, 12);

export function assertRuntimeConfig() {
  if (process.env.NODE_ENV !== "production") return;
  const value = process.env.JWT_SECRET?.trim() || "";
  if (value.length < 32 || value === DEV_SECRET) {
    throw new Error("JWT_SECRET must be a unique value of at least 32 characters in production.");
  }
}

export function secret() {
  const value = process.env.JWT_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    assertRuntimeConfig();
    return value;
  }
  return value || DEV_SECRET;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60 * 1000,
  };
}

export function signSession(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      sv: user.sessionVersion || 0,
    },
    secret(),
    { expiresIn: "12h", algorithm: "HS256" }
  );
}

export function setSession(res, token) {
  res.cookie(COOKIE, token, cookieOptions());
}

export function clearSession(res) {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(COOKIE, options);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(String(password || ""), hash || DUMMY_HASH);
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: "Sign in required." });
  let payload;
  try {
    payload = jwt.verify(token, secret(), { algorithms: ["HS256"] });
  } catch {
    return res.status(401).json({ error: "Session expired. Sign in again." });
  }
  User.findById(payload.id)
    .select("username sessionVersion mustChangePassword")
    .then((user) => {
      if (!user || (user.sessionVersion || 0) !== (payload.sv || 0)) {
        return res.status(401).json({ error: "Session expired. Sign in again." });
      }
      req.admin = {
        id: user._id.toString(),
        username: user.username,
        mustChange: user.mustChangePassword !== false,
      };
      req.adminUser = user;
      return next();
    })
    .catch(next);
}

export async function revokeSession(token) {
  if (!token) return;
  try {
    const payload = jwt.verify(token, secret(), { algorithms: ["HS256"] });
    await User.updateOne(
      { _id: payload.id, sessionVersion: payload.sv || 0 },
      { $inc: { sessionVersion: 1 } }
    );
  } catch {
    // An invalid token is already unusable. The cookie is still cleared.
  }
}
