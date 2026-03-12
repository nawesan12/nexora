export function EmptyChart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Y axis */}
      <line x1="40" y1="20" x2="40" y2="130" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.3" />
      {/* X axis */}
      <line x1="40" y1="130" x2="175" y2="130" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.3" />
      {/* Y axis ticks */}
      <line x1="36" y1="45" x2="40" y2="45" stroke="var(--muted-foreground)" strokeWidth="1" opacity="0.2" />
      <line x1="36" y1="70" x2="40" y2="70" stroke="var(--muted-foreground)" strokeWidth="1" opacity="0.2" />
      <line x1="36" y1="95" x2="40" y2="95" stroke="var(--muted-foreground)" strokeWidth="1" opacity="0.2" />
      {/* Grid lines */}
      <line x1="40" y1="45" x2="175" y2="45" stroke="var(--muted-foreground)" strokeWidth="0.5" opacity="0.1" strokeDasharray="4 4" />
      <line x1="40" y1="70" x2="175" y2="70" stroke="var(--muted-foreground)" strokeWidth="0.5" opacity="0.1" strokeDasharray="4 4" />
      <line x1="40" y1="95" x2="175" y2="95" stroke="var(--muted-foreground)" strokeWidth="0.5" opacity="0.1" strokeDasharray="4 4" />
      {/* Flat line (no data) */}
      <line x1="50" y1="120" x2="165" y2="120" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" strokeDasharray="6 4" />
      {/* Accent dot */}
      <circle cx="107" cy="120" r="3" fill="var(--accent)" opacity="0.5" />
    </svg>
  );
}
