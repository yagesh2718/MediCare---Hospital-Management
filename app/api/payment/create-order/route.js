import { razorpay } from "@/lib/razorpay";
import { CREDIT_PACKAGES } from "@/lib/plans.js";


export async function POST(req) {
  try {
    const body = await req.json();
    const { packageId } = body;

    const pkg = CREDIT_PACKAGES[packageId];
    console.log(pkg)
    if (!pkg) {
      return Response.json({ error: "Invalid package" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: pkg.amount * 100, 
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });
    return Response.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error("Create Order Error:", err); // ✅ log the issue
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
