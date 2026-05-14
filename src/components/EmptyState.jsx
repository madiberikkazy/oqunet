export default function EmptyState({ title, subtitle, icon }) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-12">
      {icon ? <div className="mb-6">{icon}</div> : null}
      <h2 className="text-2xl font-bold text-ink-900 leading-tight">{title}</h2>
      {subtitle ? <p className="mt-2 text-[15px] text-ink-500 max-w-xs">{subtitle}</p> : null}
    </div>
  );
}
