import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const { orderId, customerEmail, customerName, status } = await request.json();

  const messages = {
    ready: "Your order is being prepared and will be delivered soon!",
    delivered:
      "Your order has been delivered. Thank you for shopping with DesiCart!",
  };

  await resend.emails.send({
    from: "DesiCart <orders@yourdomain.com>",
    to: customerEmail,
    subject: `Order Update: ${status.toUpperCase()}`,
    html: `
      <h2>Hi ${customerName},</h2>
      <p>${messages[status as keyof typeof messages]}</p>
      <p>Track your order: <a href="https://desicart-gold.vercel.app/orders/${orderId}">View Status</a></p>
    `,
  });

  return NextResponse.json({ success: true });
}
