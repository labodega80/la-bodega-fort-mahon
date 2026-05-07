import { Resend } from "resend";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function calcHoldCents(guests: number) {
  return Math.min(guests * 1000, 6000);
}

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return Response.json({ error: "Stripe non configuré" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);

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
      !Number.isFinite(guests)
    ) {
      return Response.json({ error: "Données invalides" }, { status: 400 });
    }

    const amount = calcHoldCents(guests);

    // 💾 Sauvegarde
    const booking = await prisma.booking.create({
      data: {
        name,
        phone,
        email,
        date,
        time,
        guests,
        amount,
        status: "pending",
      },
    });

    const appUrl = "https://labodega-fort-mahon.fr";

    // 💳 Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,

      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          bookingId: booking.id,
        },
      },

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Réservation (${guests} pers.)`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      metadata: {
        bookingId: booking.id,
      },

      success_url: `${appUrl}/reserver/success`,
      cancel_url: `${appUrl}/reserver/cancel`,
    });

    // 📧 EMAIL (ICI 👍)
    await resend.emails.send({
      from: "La Bodega <la_bodega@fort-mahon.com>",
      to: email,
      subject: "Confirmation de réservation 🍽️",
      html: `
        <h2>Merci ${name} !</h2>
        <p>Votre réservation a bien été enregistrée.</p>
        <ul>
          <li>Date : ${date}</li>
          <li>Heure : ${time}</li>
          <li>Personnes : ${guests}</li>
        </ul>
        <p>À très bientôt 🍷</p>
      `,
    });

    return Response.json({
      checkoutUrl: session.url,
      bookingId: booking.id,
    });

  } catch (err: any) {
    console.error("BOOKINGS ERROR:", err);
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

