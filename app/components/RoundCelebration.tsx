"use client";

import { useEffect, useState } from "react";
import { messages } from "@/lib/i18n";
import { playSound } from "@/lib/sound";

/** Turun yıldızı: kusursuz tur 3, %70 ve üstü 2, %40 ve üstü 1, altı 0. */
export function starsFor(score: number, total: number): 0 | 1 | 2 | 3 {
  if (total <= 0) return 0;
  const ratio = score / total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}

const CONFETTI_COLORS = ["#facc15", "#22c55e", "#06b6d4", "#f97316", "#a855f7", "#f43f5e"];
const CONFETTI_PIECES = 70;

type Piece = { left: number; size: number; color: string; drift: number; spin: number; fall: number; delay: number; isRound: boolean };

function makePieces(): Piece[] {
  return Array.from({ length: CONFETTI_PIECES }, (_, index) => ({
    left: Math.random() * 100,
    size: 6 + Math.random() * 7,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    drift: (Math.random() - 0.5) * 160,
    spin: 360 + Math.random() * 540,
    fall: 2.2 + Math.random() * 1.6,
    delay: Math.random() * 0.6,
    isRound: Math.random() < 0.3,
  }));
}

/** Kusursuz turda ekranın üstünden dökülen konfeti; bir kez düşer ve kalkar. Hareket azaltma açıksa çizilmez (CSS). */
function Confetti() {
  const [pieces] = useState(makePieces);
  const [isDone, setIsDone] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setIsDone(true), 4600);
    return () => window.clearTimeout(timer);
  }, []);
  if (isDone) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          className="confetti-piece"
          key={index}
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.isRound ? piece.size : piece.size * 0.45,
              background: piece.color,
              borderRadius: piece.isRound ? "9999px" : "2px",
              "--drift": `${piece.drift}px`,
              "--spin": `${piece.spin}deg`,
              "--fall": `${piece.fall}s`,
              "--delay": `${piece.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function Star({ isOn, index }: { isOn: boolean; index: number }) {
  return (
    <svg
      aria-hidden="true"
      className={`star-in ${index === 1 ? "h-14 w-14 -translate-y-2 lg:h-16 lg:w-16" : "h-11 w-11 lg:h-12 lg:w-12"} short:h-9 short:w-9 ${isOn ? "text-amber-400 drop-shadow-[0_3px_0_#b45309]" : "text-slate-200"}`}
      fill="currentColor"
      style={{ "--star-delay": `${150 + index * 180}ms` } as React.CSSProperties}
      viewBox="0 0 24 24"
    >
      <path d="M12 2.6l2.83 5.74 6.33.92-4.58 4.47 1.08 6.3L12 17.05l-5.66 2.98 1.08-6.3L2.84 9.26l6.33-.92L12 2.6Z" stroke="currentColor" strokeLinejoin="round" strokeWidth={1.5} />
    </svg>
  );
}

/** Konfeti ve fanfar için en az bu kadar soru: antrenmanda tek soruluk "kusursuz" tur kutlanmasın. */
const MIN_QUESTIONS_FOR_CONFETTI = 5;

/**
 * Sonuç kartının başındaki kutlama: üç yıldız (puan oranına göre dolu), altında övgü. Ekran açılınca bitiş sesi çalar;
 * kusursuz turda (en az beş soru) fanfar ve konfeti.
 */
export function RoundCelebration({ score, total }: { score: number; total: number }) {
  const stars = starsFor(score, total);
  const isPerfect = stars === 3 && total >= MIN_QUESTIONS_FOR_CONFETTI;
  const { result } = messages();

  useEffect(() => {
    playSound(isPerfect ? "perfect" : "finish");
  }, [isPerfect]);

  return (
    <div className="flex flex-col items-center" role="img" aria-label={result.stars(stars)}>
      <div className="flex items-end gap-1">
        {[0, 1, 2].map((index) => (
          <Star index={index} isOn={index < stars} key={index} />
        ))}
      </div>
      <p className="mt-1 font-display text-xl font-bold text-slate-900 short:text-lg lg:text-2xl">{result.cheers[stars]}</p>
      {isPerfect && <Confetti />}
    </div>
  );
}
