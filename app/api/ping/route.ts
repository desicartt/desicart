import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  await supabase.from("stores").select("id").limit(1);
  return NextResponse.json({ status: "alive" });
}
