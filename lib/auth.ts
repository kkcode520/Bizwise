import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/database";
import { SessionUser } from "@/types";

const SESSION_COOKIE = "bizwise_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  password_hash: string;
};

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.AI_API_KEY || "bizwise-dev-secret";
}

function encodeBase64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function createSessionValue(user: SessionUser) {
  const payload = encodeBase64Url(
    JSON.stringify({
      user,
      exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    })
  );

  return `${payload}.${sign(payload)}`;
}

function parseSessionValue(raw: string) {
  const [payload, signature] = raw.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  const parsed = JSON.parse(decodeBase64Url(payload)) as {
    user: SessionUser;
    exp: number;
  };

  if (parsed.exp < Date.now()) {
    return null;
  }

  return parsed.user;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const db = await getDatabase();

  if (!db) {
    throw new Error("Database is required for authentication");
  }

  const [rows] = await db.execute<UserRow[]>(
    `
      SELECT id, name, email, password_hash
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email.trim().toLowerCase()]
  );

  return rows[0];
}

export async function getUserById(id: string) {
  const db = await getDatabase();

  if (!db) {
    throw new Error("Database is required for authentication");
  }

  const [rows] = await db.execute<UserRow[]>(
    `
      SELECT id, name, email, password_hash
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return rows[0]
    ? ({
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
      } satisfies SessionUser)
    : null;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await findUserByEmail(input.email);

  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }

  const db = await getDatabase();

  if (!db) {
    throw new Error("Database is required for authentication");
  }

  const now = new Date();
  const user = {
    id: `u_${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: await hashPassword(input.password),
  };

  await db.execute(
    `
      INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [user.id, user.name, user.email, user.passwordHash, now, now]
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  } satisfies SessionUser;
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const ok = await verifyPassword(password, user.password_hash);

  if (!ok) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  } satisfies SessionUser;
}

export async function updateUserProfile(input: {
  userId: string;
  name: string;
  email: string;
}) {
  const db = await getDatabase();

  if (!db) {
    throw new Error("Database is required for authentication");
  }

  const existing = await findUserByEmail(input.email);

  if (existing && existing.id !== input.userId) {
    throw new Error("EMAIL_EXISTS");
  }

  const now = new Date();

  await db.execute(
    `
      UPDATE users
      SET name = ?, email = ?, updated_at = ?
      WHERE id = ?
    `,
    [input.name.trim(), input.email.trim().toLowerCase(), now, input.userId]
  );

  return {
    id: input.userId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
  } satisfies SessionUser;
}

export async function changeUserPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const db = await getDatabase();

  if (!db) {
    throw new Error("Database is required for authentication");
  }

  const [rows] = await db.execute<UserRow[]>(
    `
      SELECT id, name, email, password_hash
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [input.userId]
  );

  const user = rows[0];

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const ok = await verifyPassword(input.currentPassword, user.password_hash);

  if (!ok) {
    throw new Error("INVALID_PASSWORD");
  }

  await db.execute(
    `
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `,
    [await hashPassword(input.newPassword), new Date(), input.userId]
  );
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSessionValue(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  return parseSessionValue(raw);
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}
