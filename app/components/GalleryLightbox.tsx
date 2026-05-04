"use client";

import React, { useEffect, useMemo, useState } from "react";

type Item = { src: string; alt: string };

export default function GalleryLightbox({
  items,
  thumbHeight = 190,
}: {
  items: Item[];
  thumbHeight?: number;
}) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  function openAt(i: number) {
    if (!safeItems.length) return;
    setIdx(i);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function prev() {
    setIdx((v) => (v - 1 + safeItems.length) % safeItems.length);
  }

  function next() {
    setIdx((v) => (v + 1) % safeItems.length);
  }

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, safeItems.length]);

  const current = safeItems[idx];

  const styles: Record<string, React.CSSProperties> = {
    grid: {
      display: "grid",
      gap: 12,
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    },
    card: {
      border: "1px solid #e6e6e6",
      borderRadius: 16,
      overflow: "hidden",
      background: "#fff",
      boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
      cursor: "pointer",
    },
    imgWrap: { overflow: "hidden" },
    img: {
      width: "100%",
      height: thumbHeight,
      objectFit: "cover",
      display: "block",
    },
    caption: {
      padding: "10px 12px",
      fontSize: 13,
      opacity: 0.8,
      borderTop: "1px solid #f0f0f0",
      background: "linear-gradient(#fff, #fafafa)",
    },

    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.78)",
      display: "grid",
      placeItems: "center",
      zIndex: 9999,
      padding: 14,
    },
    modal: {
      width: "min(1100px, 96vw)",
      borderRadius: 18,
      overflow: "hidden",
      background: "#111",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
    },
    modalTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: "10px 12px",
      background: "rgba(0,0,0,0.35)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      color: "white",
    },
    modalTitle: { fontSize: 13, opacity: 0.9 },
    modalBody: {
      position: "relative",
      background: "#000",
      display: "grid",
      placeItems: "center",
    },
    modalImg: {
      width: "100%",
      height: "min(72vh, 720px)",
      objectFit: "contain",
      display: "block",
      background: "#000",
    },
    navBtn: {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.25)",
      background: "rgba(0,0,0,0.35)",
      color: "white",
      padding: "10px 12px",
      cursor: "pointer",
      userSelect: "none",
    },
    left: { left: 10 },
    right: { right: 10 },
    closeBtn: {
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(0,0,0,0.25)",
      color: "white",
      padding: "8px 10px",
      cursor: "pointer",
    },
    hint: { fontSize: 12, opacity: 0.75 },
  };

  return (
    <>
      <div style={styles.grid}>
        {safeItems.map((it, i) => (
          <div
            key={it.src}
            className="glb-card"
            style={styles.card}
            onClick={() => openAt(i)}
            title="Cliquer pour agrandir"
          >
            <div style={styles.imgWrap}>
              <img src={it.src} alt={it.alt} style={styles.img} loading="lazy" className="glb-img" />
            </div>
            <div style={styles.caption}>{it.alt}</div>
          </div>
        ))}
      </div>

      {open && current ? (
        <div style={styles.overlay} onMouseDown={close}>
          <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.modalTop}>
              <div style={styles.modalTitle}>
                {current.alt} — {idx + 1}/{safeItems.length}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={styles.hint}>← → pour naviguer • ESC pour fermer</span>
                <button style={styles.closeBtn} onMouseDown={(e) => e.stopPropagation()} onClick={close}>
                  Fermer ✕
                </button>
              </div>
            </div>

            <div style={styles.modalBody}>
              <button
                style={{ ...styles.navBtn, ...styles.left }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={prev}
                aria-label="Précédent"
              >
                ‹
              </button>

              <img src={current.src} alt={current.alt} style={styles.modalImg} />

              <button
                style={{ ...styles.navBtn, ...styles.right }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={next}
                aria-label="Suivant"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .glb-card .glb-img {
          transform: scale(1);
          transition: transform 160ms ease;
          will-change: transform;
        }
        .glb-card:hover .glb-img {
          transform: scale(1.03);
        }
      `}</style>
    </>
  );
}