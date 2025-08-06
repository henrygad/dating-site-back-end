// Utill to genenerate unique string
import crypto from "crypto";

export const uniqueString = (num: number): string => {
  // Generate 2 random bytes and convert to hex (gives 4 hex characters = 2 bytes)
  return crypto.randomBytes(num).toString("hex");
};

export default uniqueString;
