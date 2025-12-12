// lib/crypto.ts
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function getKeyFromEnv() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY not set in env");
  // Expecting base64 or hex string — here we accept base64
  // If you prefer raw passphrase, derive a 32 byte key with a KDF (not included here).
  return Buffer.from(key, "base64");
}

export function encryptPassword(plain: string) {
  const key = getKeyFromEnv();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // store as base64 JSON to the db
  const payload = {
    v: iv.toString("base64"),
    c: ciphertext.toString("base64"),
    t: tag.toString("base64"),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decryptPassword(b64payload: string) {
  const key = getKeyFromEnv();

  // If payload is not JSON base64, throw
  let jsonStr: string;
  try {
    jsonStr = Buffer.from(b64payload, "base64").toString("utf8");
  } catch (err) {
    throw new Error("Invalid encrypted payload");
  }

  let payload;
  try {
    payload = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error("Invalid encrypted payload JSON");
  }

  const iv = Buffer.from(payload.v, "base64");
  const ciphertext = Buffer.from(payload.c, "base64");
  const tag = Buffer.from(payload.t, "base64");

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return decrypted;
}
