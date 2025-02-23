import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_SESSION_SECRET_KEY || "";

export const encryptData = (data: object) => {
  if (!SECRET_KEY) {
    throw new Error("SECRET_KEY is not defined");
  }
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

export const decryptData = (ciphertext: string) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption failed", error);
    return null;
  }
};