import Stripe from "stripe";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  email?: string;
  name?: string;
  date?: string;
  time?: string;
  status: "requested" | "authorized" | "captured" | "canceled";
  paymentIntentId?: string;
  stripeSessionId?: string;
};

const FILE = path.join(process.cwd(), "data", "bookings.json");

async function load(): Promise<Booking[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function save(bookings: Booking[]) {
  await writeFile(FILE, JSON.stringify(bookings, null, 2), "utf8");
}

function requireAdmin(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  if (!process.env.ADMIN_TOKEN) return false;
  return token === process.env.ADMIN_TOKEN;
}

/* Stripe lazy */
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

/* Email lazy (évite crash build) */
let resend: any = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY manquante → email désactivé");
    return null;
  }
  if (!resend) {
    const { Resend } = require("resend");
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const id = req.url.split("/").filter(Boolean).pop() || "";

    const bookings = await load();
    const b = bookings.find((x) => x.id === id);

    if (!b) {
      return Response.json({ ok: false, error: "Booking not found" }, { status: 404 });
    }

    b.status = "canceled";
    await save(bookings);

    /* envoi email (optionnel, safe) */
    if (b.email) {
      const client = getResend();
      if (client) {
        await client.emails.send({
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          to: b.email,
          subject: "Réservation annulée",
          text:
            "Bonjour " + (b.name || "") +
            "\n\nVotre réservation du " + (b.date || "") +
            " à " + (b.time || "") +
            " a été annulée.\n\n— La Bodega",
        });
      }
    }

    return Response.json({ ok: true, id });

  } catch (err: any) {
    console.error("ADMIN CANCEL ERROR:", err);
    return Response.json(
      { ok: false, error: "Server error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
