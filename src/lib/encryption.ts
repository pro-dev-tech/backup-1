import CryptoJS from "crypto-js";

/**
 * Encrypt a file (as ArrayBuffer) using AES-256 with the given password.
 * Returns a base64-encoded encrypted string.
 */
export function encryptData(data: ArrayBuffer, password: string): string {
  const wordArray = CryptoJS.lib.WordArray.create(data as unknown as number[]);
  return CryptoJS.AES.encrypt(wordArray, password).toString();
}

/**
 * Decrypt an AES-256 encrypted string back to ArrayBuffer.
 */
export function decryptData(encrypted: string, password: string): ArrayBuffer {
  const decrypted = CryptoJS.AES.decrypt(encrypted, password);
  const sigBytes = decrypted.sigBytes;
  const words = decrypted.words;
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8.buffer;
}

/**
 * Hash a vault password using SHA-256 for verification.
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

/**
 * Validate vault password length (8-20 characters).
 */
export function isValidVaultPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 20;
}
