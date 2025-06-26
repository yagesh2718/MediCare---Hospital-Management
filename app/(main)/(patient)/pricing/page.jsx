"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";


const creditPlans = [
  {
    id: "standard",
    name: "Standard Plan",
    credits: 10,
    price: 999,
    description: "Get 10 credits for appointments.",
  },
  {
    id: "premium",
    name: "Premium Plan",
    credits: 24,
    price: 1999,
    description: "Best value for regular use.",
  },
];

export default async function Pricing() {

  if (!authorized) {
    return redirect("/login");
  }
  const { update } = useSession();
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  }, []);

  const buyCredits = async (packageId) => {
    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      body: JSON.stringify({ packageId }),
    });

    const { orderId, amount } = await res.json();

    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount,
      currency: "INR",
      name: "MediCare",
      order_id: orderId,
      handler: async (response) => {
        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpayPaymentId: response.razorpay_payment_id,
            packageId,
          }),
        });

        if (verifyRes.ok) {
          await update()
          alert("Credits purchased!");
        } else {
          alert("Payment verification failed");
        }
      },
    });

    razorpay.open();
  };

  return (
    <div className="h-100 text-white px-4 py-22">
      <h1 className="text-4xl font-bold text-center mb-10">Choose a Plan</h1>
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        {creditPlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-blue-900/30 border border-blue-600/30 p-6 rounded-xl shadow hover:shadow-lg"
          >
            <h2 className="text-2xl font-semibold">{plan.name}</h2>
            <p className="text-zinc-400 mb-3">{plan.description}</p>
            <p className="text-4xl font-bold mb-2">₹{plan.price}</p>
            <p className="text-blue-200 mb-4">{plan.credits} credits included</p>
            <button
              onClick={() => buyCredits(plan.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
