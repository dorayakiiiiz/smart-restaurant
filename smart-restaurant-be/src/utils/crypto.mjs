import crypto from "crypto";

const algorithm = "aes-256-ctr";
// Sử dụng ACCESS_TOKEN_SECRET làm key, cắt hoặc pad cho đủ 32 bytes
let secretKey =
  process.env.ACCESS_TOKEN_SECRET || "secret_key_must_be_32_bytes_long";
if (secretKey.length < 32) {
  secretKey = secretKey.padEnd(32, "0");
} else {
  secretKey = secretKey.substring(0, 32);
}

export const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
  };
};

export const decrypt = (hash) => {
  if (!hash || !hash.iv || !hash.content) return hash;
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey),
    Buffer.from(hash.iv, "hex"),
  );
  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, "hex")),
    decipher.final(),
  ]);
  return decrpyted.toString();
};
