import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return Response.json(
        { error: "STRIPE_SECRET_KEY manquante" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey);

    const body = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Test paiement" },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],
      success_url: "https://labodega-fort-mahon.fr",
      cancel_url: "https://labodega-fort-mahon.fr",
    });

    return Response.json({ url: session.url });

  } catch (err: any) {
    console.error("FULL ERROR:", err);

    return Response.json(
      {
        error: err?.message || "unknown",
        type: err?.type,
        code: err?.code,
      },
      { status: 500 }
    );
  }
}