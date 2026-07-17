import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt_aap_2024").digest("hex");
}

function formatUser(user: any) {
  const { passwordHash: _, ...rest } = user;
  return { ...rest, createdAt: user.createdAt.toISOString() };
}

// POST /users/register
router.post("/users/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) return res.status(400).json({ error: "Email already registered" });

    const [user] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash: hashPassword(password),
      role: "customer",
    }).returning();

    res.status(201).json({ user: formatUser(user), token: `token_${user.id}` });
  } catch (err) {
    req.log.error({ err }, "Error registering user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users/login
router.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ user: formatUser(user), token: `token_${user.id}` });
  } catch (err) {
    req.log.error({ err }, "Error logging in");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users/logout
router.post("/users/logout", async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// GET /users/me
router.get("/users/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userId = parseInt(token.replace("token_", ""));
    if (isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    res.json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "Error fetching user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /users/me
router.patch("/users/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userId = parseInt(token.replace("token_", ""));
    if (isNaN(userId)) return res.status(401).json({ error: "Unauthorized" });

    const [updated] = await db.update(usersTable).set(req.body).where(eq(usersTable.id, userId)).returning();
    res.json(formatUser(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
