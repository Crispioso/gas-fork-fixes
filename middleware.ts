import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

type SessionClaims = {
  o?: {
    rol?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export default clerkMiddleware(async (auth, req) => {
  const result = await auth();
  const userId = result.userId;
  const sessionClaims = result.sessionClaims as SessionClaims;

  console.log("userId:", userId);
  console.log("sessionClaims:", JSON.stringify(sessionClaims, null, 2));

  const role = sessionClaims?.o?.rol; // `o` holds org info where `rol` is stored
  console.log("role:", role);

  // Only allow access to admin routes if role is explicitly 'admin'
  if (isAdminRoute(req)) {
    if (!userId || role !== "admin") {
      console.log("Redirecting non-admin");
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
