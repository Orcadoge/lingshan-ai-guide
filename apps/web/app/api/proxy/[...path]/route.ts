import type { NextRequest } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

async function proxy(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const upstream = new URL(`${API_BASE}/${path.join("/")}`);
  upstream.search = request.nextUrl.search;

  const init: RequestInit = {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      authorization: request.headers.get("authorization") ?? "",
      "x-request-id": request.headers.get("x-request-id") ?? crypto.randomUUID(),
    },
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const response = await fetch(upstream, init);
  const contentType =
    response.headers.get("content-type") ?? "application/json";

  if (contentType.includes("text/event-stream") && response.body) {
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          response.headers.get("cache-control") ?? "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const payload = await response.text();

  return new Response(payload, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, context.params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, context.params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, context.params);
}
