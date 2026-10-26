"use client";

import { messages } from "@/lib/i18n";
import { useState } from "react";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { lockLandscape, useIsPortraitPhone } from "@/lib/orientation";

/** Yan çevrilen telefon: içindeki harita dik kalır ve yatay ekrana sığacak kadar büyür. */
export function RotateDemo() {
  return (
    <div aria-hidden="true" className="flex h-full items-center justify-center">
      <div className="tip-phone flex h-24 w-14 items-center justify-center overflow-hidden rounded-xl border-[3px] border-cyan-700 bg-cyan-50">
        <span className="tip-phone-map map-silhouette block h-[1.6rem] w-11 bg-cyan-600" />
      </div>
    </div>
  );
}

/** İki parmak açılır, harita Malta'ya yakınlaşır ve küçük ada belirginleşir. */
export function PinchDemo() {
  return (
    <div aria-hidden="true" className="flex h-full items-center justify-center">
      <div className="relative h-28 w-44 overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50">
        <span className="tip-zoom map-silhouette absolute inset-2 bg-cyan-400" />
        <span className="absolute top-[42.9%] left-[52.3%]">
          <span className="tip-spot absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white" />
          <span className="tip-finger-a absolute -top-3 -left-3 h-6 w-6 rounded-full border-2 border-cyan-700 bg-cyan-700/25" />
          <span className="tip-finger-b absolute -top-3 -left-3 h-6 w-6 rounded-full border-2 border-cyan-700 bg-cyan-700/25" />
        </span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    get title() { return messages().playTips.rotateTitle; },
    get body() { return messages().playTips.rotateBody; },
    visual: <RotateDemo />,
  },
  {
    get title() { return messages().playTips.pinchTitle; },
    get body() { return messages().playTips.pinchBody; },
    visual: <PinchDemo />,
  },
];

type PlayTipsProps = {
  /** Mobil uygulamada ilk adımda "Yatay moda geç" tuşu çıkar; oyun haritası açılmak üzereyken verilir. */
  canLockLandscape: boolean;
  /** Oyuncu ipuçlarını bitirdi: ipuçları bir daha gösterilmez, oyun başlar. */
  onDone: () => void;
  /** Android geri tuşu: oyun başlamaz, ipuçları sonraki oyunda yeniden gösterilir. Verilmezse geri tuşu da bitirir. */
  onCancel?: () => void;
};

/**
 * Dikey telefonda ilk oyundan önce bir kez gösterilen iki adımlı ipucu: yan çevir, iki parmakla yakınlaştır. Oyun
 * ekranının üstünde bulanık bir katmanda, uygulamanın kendi kartıyla durur. Süreli oyunun süresi kart kapanınca başlar.
 * Oyuncu ilk adımda telefonu yan çevirirse (ya da uygulamada "Yatay moda geç" derse) o adım tamamlanmış sayılır ve kart
 * iki parmak adımına geçer.
 */
export function PlayTips({ canLockLandscape, onDone, onCancel }: PlayTipsProps) {
  const [chosenStep, setStep] = useState(0);
  const isPortrait = useIsPortraitPhone();
  // Yatay tutulan telefonda yan çevir adımı geçilmiş sayılır.
  const step = isPortrait ? chosenStep : Math.max(chosenStep, 1);
  const isLast = step === STEPS.length - 1;
  useBackHandler(onCancel ?? onDone, BACK_PRIORITY.dialog);

  const next = () => (isLast ? onDone() : setStep(step + 1));
  const { title, body, visual } = STEPS[step];

  return (
    <div className="safe-area fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 p-5 backdrop-blur-md short:p-3">
      <div
        aria-labelledby="play-tips-title"
        aria-modal="true"
        className="max-h-full w-full max-w-sm overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-2xl shadow-slate-900/15"
        role="dialog"
      >
        <div aria-hidden="true" className="flex justify-center gap-1.5">
          {STEPS.map((item, index) => (
            <span className={`h-1.5 rounded-full transition-all ${index === step ? "w-5 bg-cyan-600" : "w-1.5 bg-slate-200"}`} key={item.title} />
          ))}
        </div>
        <div className="mt-3 h-36 short:mt-1 short:h-28" key={step}>
          {visual}
        </div>
        <p className="mt-2 font-display text-xl font-bold text-slate-900" id="play-tips-title">
          {title}
        </p>
        <p className="mt-1.5 text-sm text-slate-500">{body}</p>

        <div className="mt-5 flex flex-col gap-2 short:mt-3">
          {step === 0 && canLockLandscape ? (
            <>
              <button
                className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
                onClick={() => {
                  void lockLandscape();
                  setStep(1);
                }}
                type="button"
              >
                {messages().playTips.toLandscape}
              </button>
              <button className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-cyan-700" onClick={next} type="button">
                {messages().playTips.stayPortrait}
              </button>
            </>
          ) : (
            <button className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700" onClick={next} type="button">
              {isLast ? messages().common.start : messages().common.continue}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
