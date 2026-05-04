"use client";

export default function HeroActions() {
  return (
    <div className="heroCtas">
      <a className="btn btnPrimary" href="/reserver">
        Réserver maintenant →
      </a>

      <a className="btn btnGhost" href="/menu">
        Menu
      </a>

      <a className="btn btnGhost" href="/emporter">
        Vente à emporter
      </a>

      <a
        className="btn btnGoogle"
        href="https://www.google.com/search?q=La+Bodega+Fort-Mahon-Plage+avis"
        target="_blank"
        rel="noreferrer"
      >
        ★ Avis Google
      </a>

      <style jsx>{`
        .heroCtas {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(0, 0, 0, 0.28);
          color: #fff;
          backdrop-filter: blur(6px);
        }

        .btnPrimary {
          background: rgba(170, 0, 0, 0.92);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btnGhost:hover,
        .btnGoogle:hover {
          background: rgba(0, 0, 0, 0.38);
        }

        .btnPrimary:hover {
          background: rgba(190, 0, 0, 0.95);
        }

        .btnGoogle {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
  );
}