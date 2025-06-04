// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  console.log("userId:", userId);
  console.log("sessionClaims:", sessionClaims);

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role;
  console.log("role:", role);

  if (isAdminRoute(req)) {
    if (!userId || role !== "admin") {
      console.log("Redirecting: not admin or not signed in");
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});


export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"], // Match all routes except static files
};
