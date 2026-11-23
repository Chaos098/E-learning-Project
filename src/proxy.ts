import { NextResponse } from "next/server";

import { auth } from "@/server/auth/config";
import { requiredRoleForPath } from "@/server/auth/roles";

// Lớp chặn sớm theo khu vực (US-03). Quyết định cuối cùng vẫn nằm ở requireActor() và
// assertRole() trong từng trang, server action và service.
export default auth((request) => {
  const required = requiredRoleForPath(request.nextUrl.pathname);
  if (!required) return NextResponse.next();

  const role = request.auth?.user?.role;
  if (!role) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  if (role !== required) {
    return NextResponse.rewrite(new URL("/403", request.nextUrl), { status: 403 });
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
