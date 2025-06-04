import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  console.log("userId:", userId);
  console.log("sessionClaims:", sessionClaims);

  const metadata = sessionClaims?.metadata as { role?: string };
  const role = metadata?.role;

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
  matcher: ["/((?!_next|.*\\..*).*)"],
};
