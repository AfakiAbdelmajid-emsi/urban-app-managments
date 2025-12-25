import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(`/users/${id}`, request);
}

