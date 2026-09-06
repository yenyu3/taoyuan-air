import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
];

const AUTH_PATHS = [
  "/login",
  "/register",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // debug
  console.log("pathname =", pathname);
  console.log("basePath =", request.nextUrl.basePath);
  console.log("url =", request.nextUrl.href);


  const basePath = request.nextUrl.basePath || "";

  const routePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || "/"
    : pathname;


  const accessToken = request.cookies.get("access_token")?.value;


  const isPublic = PUBLIC_PATHS.includes(routePath);


  if (!accessToken && !isPublic) {
    const url = request.nextUrl.clone();

    url.pathname = "/login";

    return NextResponse.redirect(url);
  }


  if (accessToken && AUTH_PATHS.includes(routePath)) {
    const url = request.nextUrl.clone();

    url.pathname = "/dashboard";

    return NextResponse.redirect(url);
  }


  return NextResponse.next();
}


export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};