import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!password || !hash || !salt) return false;
  try {
    const computed = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
    const expected = Buffer.from(hash, "hex");
    if (computed.length !== expected.length) return false;
    return timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

export function isStrongEnough(password: string): boolean {
  return typeof password === "string" && password.length >= 8;
}
