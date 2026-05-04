"use client";

import { useMemo, useState } from "react";

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
  refundId?: string;
};

type ApiList = { ok: boolean; bookings?: Booking[]; error?: string; details?: any };

function euros(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

export default function AdminBookingsPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | Booking["status"]>("all");
  const [log, setLog] = useState<string>("");

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  async function loadBookings() {
    setLoading(true);
    setErr("");
    setLog("");

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "GET",
        headers: { "x-admin-token": token.trim() },
        cache: "no-store",
      });

      const text = await res.text();
      console.log("ADMIN /api/admin/bookings status:", res.status);
      console.log("ADMIN /api/admin/bookings text:", text);

      let data: ApiList | any = {};
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        const msg = (data?.error || text || "Erreur inconnue").toString();
        setErr(`Erreur ${res.status}: ${msg}`);
        setBookings([]);
        return;
      }

      if (!data?.ok) {
        setErr(data?.error || "Réponse API invalide");
        setBookings([]);
        return;
      }

      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      setLog(`Chargé: ${Array.isArray(data.bookings) ? data.bookings.length : 0} réservation(s)`);
    } catch (e: any) {
      console.error("ADMIN fetch error:", e);
      setErr("Erreur réseau: " + (e?.message || String(e)));
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function postAction(url: string) {
    setErr("");
    setLog("");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "x-admin-token": token.trim() },
        cache: "no-store",
      });

      const text = await res.text();
      console.log("ADMIN action", url, "status:", res.status);
      console.log("ADMIN action", url, "text:", text);

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok || data?.ok === false) {
        setErr(`Action KO: ${data?.error || text || "Erreur"}`);
        return;
      }

      setLog(`Action OK: ${url} (${data?.stripeStatus ?? ""})`);
      await loadBookings();
    } catch (e: any) {
      console.error("ADMIN action error:", e);
      setErr("Erreur réseau: " + (e?.message || String(e)));
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
      <h1>Admin — Réservations</h1>

      <div style={{ display: "grid", gap: 10, maxWidth: 520, marginTop: 12 }}>
        <label style={{ fontWeight: 600 }}>JETON_ADMIN</label>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="change-moi"
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />

        <button
          onClick={loadBookings}
          disabled={loading || !token.trim()}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", cursor: "pointer" }}
        >
          {loading ? "Chargement…" : "Charger"}
        </button>

        <div style={{ fontSize: 14, padding: 10, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}>
          <b>Rappel client :</b> Annulation gratuite jusqu&apos;à 3h avant l&apos;heure de réservation. Passé ce délai, les
          arrhes sont conservées.
        </div>

        {err ? (
          <div style={{ color: "#b00020", fontSize: 14, whiteSpace: "pre-wrap" }}>
            <b>Erreur:</b> {err}
          </div>
        ) : null}

        {log ? (
          <div style={{ color: "#0b6b0b", fontSize: 14, whiteSpace: "pre-wrap" }}>
            <b>Info:</b> {log}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["all", "requested", "authorized", "captured", "canceled"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k as any)}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid #ddd",
              cursor: "pointer",
              background: filter === k ? "#eee" : "white",
            }}
          >
            {k === "all" ? "Tous" : k}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr>
              {["ID", "Date", "Heure", "Nom", "Email", "Tel", "Pax", "Montant", "Statut", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #ddd" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: 12 }}>
                  Aucune réservation.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee", fontFamily: "monospace" }}>{b.id}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{b.date}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{b.time}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{b.name}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{b.email}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{b.phone}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{b.guests}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{euros(b.amountCents)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>{b.status}</td>

                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {/* REQUESTED → seulement Refuser */}
                      {b.status === "requested" && (
                        <button
                          onClick={() => postAction(`/api/admin/bookings/${b.id}/reject`)}
                          style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer" }}
                        >
                          Refuser
                        </button>
                      )}

                      {/* AUTHORIZED → Accepter + Refuser */}
                      {b.status === "authorized" && (
                        <>
                          <button
                            onClick={() => postAction(`/api/admin/bookings/${b.id}/accept`)}
                            style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer" }}
                          >
                            Accepter
                          </button>

                          <button
                            onClick={() => postAction(`/api/admin/bookings/${b.id}/reject`)}
                            style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer" }}
                          >
                            Refuser
                          </button>
                        </>
                      )}

                      {/* CAPTURED → Annuler / Rembourser */}
                      {b.status === "captured" && (
                        <button
                          onClick={() => postAction(`/api/bookings/${b.id}/cancel`)}
                          style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer" }}
                        >
                          Annuler / Rembourser
                        </button>
                      )}

                      {/* CANCELED → info seule */}
                      {b.status === "canceled" && (
                        <span style={{ fontSize: 13, color: "#666" }}>
                          Annulée{b.refundId ? ` (refund ${b.refundId})` : ""}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 18 }}>
        <a href="/">← Retour</a>
      </p>
    </main>
  );
}