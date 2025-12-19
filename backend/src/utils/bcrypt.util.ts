import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return await bcrypt.compare(plain, hashed);
}
