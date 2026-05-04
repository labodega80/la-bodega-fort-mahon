import Stripe from "stripe";

export const runtime = "nodejs";

type Booking = any;

declare global {
  // eslint-disable-next-line no-var
  var __BOOKINGS__: Booking[] | undefined;
}

const bookings: Booking[] = global.__BOOKINGS__ || [];
global.__BOOKINGS__ = bookings;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function checkAuth(req: Request) {
  const token = req.headers.get("x-admin-token");
  return token && token === process.env.ADMIN_TOKEN;
}

export async function POST(req: Request) {
  if (!checkAuth(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId } = await req.json();
  const b = bookings.find((x) => x.id === bookingId);
  if (!b) return Response.json({ error: "Not found" }, { status: 404 });
  if (!b.paymentIntentId) return Response.json({ error: "No paymentIntentId" }, { status: 400 });

  // Cancel = libérer l’autorisation
  await stripe.paymentIntents.cancel(b.paymentIntentId);

  b.status = "canceled";
  return Response.json({ ok: true });
}
