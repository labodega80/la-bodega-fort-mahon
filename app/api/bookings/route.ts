import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookingInput = {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
};

function calcHoldCents(guests: number) {
  return Math.min(guests * 1000, 6000);
}

export async function POST(req: Request) {
  try {
    // 🔍 Vérif clé Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      console.error("❌ STRIPE_SECRET_KEY manquante");
      return Response.json(
        { error: "Configuration Stripe manquante" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey);

    // 📦 Lecture JSON
    let body: BookingInput;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "JSON invalide" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const date = String(body.date || "").trim();
    const time = String(body.time || "").trim();
    const guests = Number(body.guests);

    // ✅ Validation
    if (
      !name ||
      !phone ||
      !email ||
      !date ||
      !time ||
      !Number.isFinite(guests) ||
      guests < 1 ||
      guests > 20
    ) {
      return Response.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    const id = Math.random().toString(36).slice(2);
    const amountCents = calcHoldCents(guests);

    const appUrl = "https://labodega-fort-mahon.fr";

    // 💳 Création session Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,

      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          bookingId: id,
          name,
          phone,
          date,
          time,
          guests: String(guests),
        },
      },

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Réservation (${guests} pers.)`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],

      metadata: {
        bookingId: id,
      },

      success_url: `${appUrl}/reserver/success`,
      cancel_url: `${appUrl}/reserver/cancel`,
    });

    return Response.json({
      ok: true,
      checkoutUrl: session.url,
      bookingId: id,
      amountCents,
    });

  } catch (err: any) {
    console.error("🔥 BOOKINGS ERROR:", err);

    return Response.json(
      {
        error: "Erreur serveur /api/bookings",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}