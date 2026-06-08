interface Stat {
  value: string;
  label: string;
}

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border pt-12">
      {stats.map((s) => (
        <div key={s.label} className="space-y-1">
          <p className="font-mono text-2xl font-medium">{s.value}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
