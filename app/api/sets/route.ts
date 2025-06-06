import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Card?select=set`, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
    },
  });

  if (!res.ok) {
    console.error("❌ Failed to fetch sets from Supabase:", await res.text());
    return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 });
  }

  const rows = await res.json();
  const sets = [...new Set(rows.map((row: any) => row.set).filter(Boolean))].sort();

  return NextResponse.json({ sets });
}
