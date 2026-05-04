import { readFile } from "fs/promises";
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

function requireAdmin(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  if (!process.env.ADMIN_TOKEN) return false;
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const bookings = await load();
  // tri par date/heure simple (string ISO + HH:mm)
  bookings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return Response.json({ ok: true, bookings });
}