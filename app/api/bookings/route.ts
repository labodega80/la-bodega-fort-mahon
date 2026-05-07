import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  amountCents: number;
};

function calcHoldCents(guests: number) {
  return Math.min(guests * 1000, 6000);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const date = String(body.date || "").trim();
    const time = String(body.time || "").trim();
    const guests = Number(body.guests);

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
      return Response.json({ error: "Données invalides." }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const id = Math.random().toString(36).slice(2);
    const amountCents = calcHoldCents(guests);

    const appUrl = "https://labodega-fort-mahon.fr";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,

      payment_intent_data: {
        capture_method: "manual",
        metadata: { bookingId: id, type: "booking_hold" },
      },

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Empreinte réservation (${guests} pers.)` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],

      metadata: { type: "booking_hold", bookingId: id },

      success_url: `${appUrl}/reserver/success`,
      cancel_url: `${appUrl}/reserver/cancel`,
    });

    return Response.json({
      ok: true,
      checkoutUrl: session.url,
      bookingId: id,
      sessionId: session.id,
      amountCents,
    });

  } catch (err: any) {
    console.error("BOOKINGS API ERROR:", err);
    return Response.json(
      { error: "Erreur serveur /api/bookings", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}