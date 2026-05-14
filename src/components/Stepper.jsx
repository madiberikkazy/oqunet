import { t } from "../utils/i18n.js";

export default function Stepper({ step, total, title }) {
  const progress = Math.max(0, Math.min(1, step / total));
  return (
    <div className="px-4 pt-2 pb-3">
      <div className="text-center">
        <h2 className="font-semibold text-ink-900">{title}</h2>
        <p className="text-[13px] text-ink-500 mt-0.5">
          {t.step} {step} {t.ofStep} {total}
        </p>
      </div>
      <div className="mt-3 h-1.5 bg-ink-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
