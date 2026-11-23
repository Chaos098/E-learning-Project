import bcrypt from "bcryptjs";

/** Số vòng băm bcrypt (NFR-01). 10 vòng ~ 60–100 ms mỗi lần, đủ cho đồ án. */
const SALT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}
