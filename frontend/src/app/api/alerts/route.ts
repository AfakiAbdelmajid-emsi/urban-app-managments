import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy-helper';

export async function GET(request: NextRequest) {
  return proxyRequest('/alerts', request);
}

export async function POST(request: NextRequest) {
  return proxyRequest('/alerts', request);
}
