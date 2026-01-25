// lib/crypto.ts
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // recomendado para GCM

function getKeyFromEnv(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY not set in env");
  const keyBuf = Buffer.from(key, "base64");
  if (keyBuf.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (base64 of 32 bytes)");
  }
  return keyBuf;
}

/** Convierte un Buffer a Uint8Array explícitamente (evita problemas de tipos). */
function asUint8(b: Buffer): Uint8Array {
  // new Uint8Array(buffer) crea una vista que satisface ArrayBufferView
  return new Uint8Array(b);
}

export function encryptPassword(plain: string): string {
  const keyBuf = getKeyFromEnv();
  const keyObj = crypto.createSecretKey(keyBuf); // KeyObject -> cumple las firmas

  const ivBuf = crypto.randomBytes(IV_LENGTH);
  const ivView = asUint8(ivBuf);

  // Usar ivView (Uint8Array) en la llamada para que TS esté contento
  const cipher = crypto.createCipheriv(ALGO, keyObj, ivView) as crypto.CipherGCM;

  // cipher.update con input string devuelve Buffer, no lo pasamos a APIs que pidan ArrayBufferView
  const ciphertextBuf = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);

  const tagBuf = cipher.getAuthTag();

  const payload = {
    v: ivBuf.toString("base64"),
    c: ciphertextBuf.toString("base64"),
    t: tagBuf.toString("base64"),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decryptPassword(b64payload: string): string {
  const keyBuf = getKeyFromEnv();
  const keyObj = crypto.createSecretKey(keyBuf);

  let jsonStr: string;
  try {
    jsonStr = Buffer.from(b64payload, "base64").toString("utf8");
  } catch {
    throw new Error("Invalid encrypted payload");
  }

  let payload: { v: string; c: string; t: string };
  try {
    payload = JSON.parse(jsonStr);
  } catch {
    throw new Error("Invalid encrypted payload JSON");
  }

  const ivBuf = Buffer.from(payload.v, "base64");
  const ciphertextBuf = Buffer.from(payload.c, "base64");
  const tagBuf = Buffer.from(payload.t, "base64");

  // Convertir explícitamente a Uint8Array antes de pasarlo a las APIs que TypeScript tipa como ArrayBufferView
  const ivView = asUint8(ivBuf);
  const tagView = asUint8(tagBuf);
  const ciphertextView = asUint8(ciphertextBuf);

  const decipher = crypto.createDecipheriv(ALGO, keyObj, ivView) as crypto.DecipherGCM;
  decipher.setAuthTag(tagView);

  const decryptedBuf = Buffer.concat([decipher.update(ciphertextView), decipher.final()]);
  return decryptedBuf.toString("utf8");
}
