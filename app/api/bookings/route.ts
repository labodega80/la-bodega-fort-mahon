import { Resend } from "resend";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function calcHoldCents(guests: number) {
  return Math.min(guests * 1000, 6000);
}

export async function GET() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify(bookings, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return Response.json({ error: "Stripe non configuré" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);

    const body = await req.json();

    const name = String(body.name || "");
    const phone = String(body.phone || "");
    const email = String(body.email || "");
    const date = String(body.date || "");
    const time = String(body.time || "");
    const guests = Number(body.guests);

    if (!name || !phone || !email || !date || !time || !guests) {
      return Response.json({ error: "Données invalides" }, { status: 400 });
    }

    const amount = calcHoldCents(guests);

    // 💾 DB
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
      success_url: `${appUrl}/reserver/success`,
      cancel_url: `${appUrl}/reserver/cancel`,
    });

    // 📧 Email sécurisé 
    try {
      if (resend) {
        const result = await resend.emails.send({
        from: "La Bodega <la_bodega@fort-mahon.com>",
        to: email,
        subject: "Confirmation de réservation",
        html: `<p>Merci ${name}, réservation enregistrée.</p>`,
      });

      console.log("EMAIL RESULT:", result);

      // 📧 notification resto
      await resend.emails.send({
        from: "La Bodega <la_bodega@fort-mahon.com>",
        to: "la_bodega@fort-mahon.com",
        subject: "🔔 Nouvelle réservation",
        html: `
        <h2>Nouvelle réservation</h2>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Téléphone :</strong> ${phone}</p>
        <p><strong>Email :</strong> ${email}</p>
        <hr />
        <p><strong>Date :</strong> ${date}</p>
        <p><strong>Heure :</strong> ${time}</p>
        <p><strong>Personnes :</strong> ${guests}</p>
        <hr />
        <p><strong>ID :</strong> ${booking.id}</p>
      `,
    });
  }
} catch (e) {
  console.error("EMAIL ERROR:", e);
}

    return Response.json({
      checkoutUrl: session.url,
    });

  } catch (err: any) {
    console.error("BOOKINGS ERROR:", err);
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

