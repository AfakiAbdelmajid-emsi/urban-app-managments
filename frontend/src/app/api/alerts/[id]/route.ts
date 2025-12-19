import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/proxy-helper';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(`/alerts/${id}`, request);
}
