import { NextRequest, NextResponse } from "next/server";

const api = process.env.API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3001";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<NextResponse> {
  const { path } = await context.params;
  const target = new URL(`${api}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const type = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
  if (type) headers.set("content-type", type);
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers.set("x-forwarded-for", forwarded);

  const method = request.method;
  const response = await fetch(target, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" || method === "DELETE" ? undefined : await request.arrayBuffer(),
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  for (const cookieHeader of response.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookieHeader);
  }

  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return new NextResponse(null, { status: response.status, headers: responseHeaders });
  }

  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
