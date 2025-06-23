import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { allocateCreditsAfterPurchase } from "@/actions/credits";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const { razorpayPaymentId, packageId } = await req.json();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Use action to allocate credits
    const updatedUser = await allocateCreditsAfterPurchase(packageId);

    if (!updatedUser) {
      return NextResponse.json({ error: "Credit allocation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, credits: updatedUser.credits });
  } catch (error) {
    console.error("Payment verification error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
