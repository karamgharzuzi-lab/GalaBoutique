import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin is always Hebrew — redirect /en/admin/* → /he/admin/*
  if (pathname.startsWith("/en/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/en/admin", "/he/admin");
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next|_vercel|.*\\..*).*)",
    "/([\\w-]+)?/admin(.*)?",
  ],
};
