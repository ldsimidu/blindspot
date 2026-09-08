import { scrypt, timingSafeEqual } from "node:crypto";
import { HttpError } from "./types";

export const passwordAlgorithm = "scrypt-v1:N=16384,r=8,p=1,dkLen=64";

export function assertPassword(password: string): void {
  if (password.length < 12 || password.length > 128) throw new HttpError(400, "Ativacao indisponivel.");
}

export async function derivePassword(password: string, salt: string): Promise<string> {
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper || pepper.length < 32) throw new HttpError(503, "Ativacao indisponivel.");
  const output = await new Promise<Buffer>((resolve, reject) => scrypt(`${password}\u0000${pepper}`, salt, 64, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, derivedKey) => error ? reject(error) : resolve(derivedKey)));
  return output.toString("base64url");
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const candidate = Buffer.from(await derivePassword(password, salt), "base64url");
  const expected = Buffer.from(expectedHash, "base64url");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function verifyPasswordFallback(password: string): Promise<void> {
  const candidate = Buffer.from(await derivePassword(password, "AAAAAAAAAAAAAAAAAAAAAA"), "base64url");
  timingSafeEqual(candidate, Buffer.alloc(candidate.length));
}
