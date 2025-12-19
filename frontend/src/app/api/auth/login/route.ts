import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy-helper';

export async function POST(request: NextRequest) {
  return proxyRequest('/auth/login', request);
}
