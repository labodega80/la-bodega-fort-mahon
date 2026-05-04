import Stripe from "stripe";
import { readFile, writeFile } from "fs/promises";
import path from "path";

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
  status: "requested" | "authorized" | "captured" | "canceled";
  stripeSessionId?: string;
  paymentIntentId?: string;
};

const FILE = path.join(process.cwd(), "data", "bookings.json");

async function load(): Promise<Booking[]> {
  try { return JSON.parse(await readFile(FILE, "utf8")); } catch { return []; }
}
async function save(bookings: Booking[]) {
  await writeFile(FILE, JSON.stringify(bookings, null, 2), "utf8");
}

// email (optionnel mais prêt)
async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST) return; // si pas configuré, on n’envoie pas
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@example.com",
    to,
    subject,
    text,
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const bookings = await load();
  const b = bookings.find((x) => x.id === id);

  if (!b) {
    return Response.json({ ok: false, error: "Booking not found", id }, { status: 404 });
  }

  // Déjà encaissée ? -> On ne "refuse" plus, c’est une annulation (cancel) qui gère la règle des 3h.
  if (b.status === "captured") {
    return Response.json({ ok: false, error: "Already captured, use /cancel", id }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Si on a un PI, on l’annule (libère l’empreinte / annule le paiement)
  if (b.paymentIntentId) {
    try {
      await stripe.paymentIntents.cancel(b.paymentIntentId);
    } catch (e: any) {
      // si déjà annulé ou autre, on continue quand même côté fichier
      console.warn("REJECT: paymentIntent cancel failed", e?.message || e);
    }
  }

  b.status = "canceled";
  await save(bookings);

  // Email au client
  await sendEmail(
    b.email,
    "Réservation refusée",
    `Bonjour ${b.name},\n\nVotre réservation du ${b.date} à ${b.time} a été refusée par l’établissement.\nAucune somme n’a été encaissée.\n\n— La Bodega`
  );

  return Response.json({ ok: true, id, status: b.status });
}