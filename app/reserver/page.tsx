"use client";

import { useState } from "react";

export default function ReserverPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [msg, setMsg] = useState("");

  async function requestHold() {
    try {
      setMsg("Création de la demande…");

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, date, time, guests }),
      });

      const text = await res.text();
      console.log("BOOKINGS response status:", res.status);
      console.log("BOOKINGS response text:", text);

      let out: any = {};
      try {
        out = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        setMsg(`Erreur ${res.status}: ` + (out.error || text || "Erreur"));
        return;
      }

      if (!out.checkoutUrl) {
        setMsg("Erreur: checkoutUrl manquant. Réponse: " + text.slice(0, 200));
        return;
      }

      setMsg("Redirection vers paiement (empreinte CB)…");
      <p style={{ marginTop: 10, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <b>Conditions d’annulation</b><br />
      Annulation gratuite jusqu&apos;à <b>3h</b> avant l&apos;heure de réservation.
      Passé ce délai, les <b>arrhes sont conservées</b>.
      </p>
      window.location.href = out.checkoutUrl;
      } catch (e: any) {
      console.error("BOOKINGS fetch error:", e);
      setMsg("Erreur réseau: " + (e?.message || String(e)));
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1>Réserver une table</h1>

      <p>
        On effectue une <b>empreinte CB</b> (autorisation) pour garantir la réservation.
        L’empreinte n’est <b>encaissée</b> que si l’établissement <b>accepte</b> la réservation.
      </p>

      {/* ✅ Règles d’annulation affichées AVANT paiement */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          background: "#fafafa",
        }}
      >
        <b>Conditions d’annulation</b>
        <ul style={{ margin: "8px 0 0 18px" }}>
          <li>
            <b>Annulation + de 3h</b> avant l’heure prévue : l’empreinte est <b>libérée</b> (non encaissée).
          </li>
          <li>
            <b>Annulation - de 3h</b> avant l’heure prévue : les arrhes sont <b>perdues</b> (paiement encaissé).
          </li>
        </ul>
      </div>

      <div style={{ display: "grid", gap: 10, maxWidth: 450 }}>
        <input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />

        <label>Nombre de personnes</label>
        <input
          type="number"
          min={1}
          max={20}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
        />

        <button onClick={requestHold} style={{ padding: 12 }}>
          Continuer (empreinte CB)
        </button>

        {msg ? (
          <p>
            <b>{msg}</b>
          </p>
        ) : null}

        <p>
          <a href="/">← Retour accueil</a>
        </p>
      </div>
    </main>
  );
}