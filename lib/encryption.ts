import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {

  const secret = process.env.TOKEN_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("TOKEN_ENCRYPTION_SECRET must be set and at least 32 characters");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedData: string): string {
  const [ivHex, authTagHex, encryptedText] = encryptedData.split(":");
  if (!ivHex || !authTagHex || !encryptedText) {
    throw new Error("Invalid encrypted token format");
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
