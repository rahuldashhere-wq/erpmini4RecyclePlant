import crypto from "crypto";

export const hashPasscode = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
