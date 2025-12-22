import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Skip Stripe if no key configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error: "Stripe not configured. Payment on delivery.",
      },
      { status: 200 }
    );
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { items, orderId, customerEmail } = await request.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "aud",
          product_data: {
            name: item.name,
            description: `Quantity: ${item.quantity}`,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      customer_email: customerEmail,
      metadata: { orderId },
      success_url: `${process.env.NEXT_PUBLIC_URL}/orders/${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/?cancelled=true`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
