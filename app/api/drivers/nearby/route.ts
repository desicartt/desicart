import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "10"); // km

  const { data } = await supabase.rpc("nearby_drivers", {
    store_lat: lat,
    store_lng: lng,
    rad_km: radius,
  });
  return NextResponse.json(data || []);
}
