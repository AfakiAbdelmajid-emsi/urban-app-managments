import { Request } from 'express';

export const jwtExtractor = (req: Request): string | null => {
  const authHeader: string | undefined = req.header('authorization');

  if (!authHeader) return null;

  if (!authHeader.startsWith('Bearer ')) return null;

  return authHeader.substring('Bearer '.length).trim();
};
