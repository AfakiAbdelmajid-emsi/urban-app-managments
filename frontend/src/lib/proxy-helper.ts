/**
 * Helper function to proxy requests from Next.js API routes to the NestJS backend
 */
export async function proxyRequest(
  path: string,
  request: Request
): Promise<Response> {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://urban-app-managments-production.up.railway.app';
  // Remove trailing slash if present and ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  const url = new URL(cleanPath, baseUrl);
  
  // Preserve query parameters from the original request
  const requestUrl = new URL(request.url);
  requestUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // Get the request body if it exists
  let body: string | undefined;
  const contentType = request.headers.get('content-type');
  if (request.method !== 'GET' && request.method !== 'HEAD' && contentType) {
    body = await request.text();
  }

  // Forward headers (preserve Authorization and Content-Type)
  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers.set('authorization', authHeader);
  }
  if (contentType) {
    headers.set('content-type', contentType);
  }

  try {
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    // Get response body
    const responseBody = await response.text();
    
    // Return response with same status and headers
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Failed to connect to backend',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
