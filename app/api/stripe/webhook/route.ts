import Stripe from "stripe";

export const runtime = "nodejs";

/* ✅ Stripe lazy (ANTI BUG VERCEL) */
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // 👉 tu peux gérer les events ici si tu veux
    console.log("Webhook reçu :", event.type);

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err: any) {
    console.error("WEBHOOK ERROR:", err);
    return new Response("Webhook Error", { status: 400 });
  }
}