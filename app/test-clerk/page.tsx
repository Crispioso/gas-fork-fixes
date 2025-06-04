// app/test-clerk/page.tsx
"use client";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function TestClerkPage() {
  return (
    <div>
      <h1>Clerk Test Page</h1>
      <SignedIn>
        <p>You are signed in!</p>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <p>You are signed out.</p>
        <SignInButton mode="modal" />
      </SignedOut>
    </div>
  );
}