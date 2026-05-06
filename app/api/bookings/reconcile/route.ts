
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ✅ Stripe lazy */
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY missing");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export async function POST() {
  try {
    const stripe = getStripe();

    // exemple simple (tu peux adapter après)
    const intents = await stripe.paymentIntents.list({ limit: 5 });

    return Response.json({
      ok: true,
      count: intents.data.length,
    });

  } catch (err: any) {
    console.error("RECONCILE ERROR:", err);
    return Response.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}