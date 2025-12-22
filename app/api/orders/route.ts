import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { customer_id, store_id, items } = await req.json();
  const { data: prods } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store_id);
  const total = prods.reduce(
    (sum: number, p: any) =>
      sum + (p.price * items.find((i: any) => i.id === p.id)?.qty || 0),
    0
  );

  const { data: order } = await supabase
    .from("orders")
    .insert({ customer_id, store_id, total, items })
    .select();
  return NextResponse.json(order[0]);
}

export async function GET() {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json(data);
}
