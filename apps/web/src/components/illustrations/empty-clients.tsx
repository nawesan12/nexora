export function EmptyClients({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Person 1 (center) */}
      <circle cx="100" cy="55" r="16" stroke="var(--muted-foreground)" strokeWidth="1.5" fill="var(--muted)" fillOpacity="0.4" />
      <path
        d="M72 105c0-15.5 12.5-28 28-28s28 12.5 28 28"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Person 2 (left) */}
      <circle cx="55" cy="68" r="11" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.4" fill="var(--muted)" fillOpacity="0.3" />
      <path
        d="M35 108c0-11 9-20 20-20s20 9 20 20"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />
      {/* Person 3 (right) */}
      <circle cx="145" cy="68" r="11" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.4" fill="var(--muted)" fillOpacity="0.3" />
      <path
        d="M125 108c0-11 9-20 20-20s20 9 20 20"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />
      {/* Connection dots */}
      <circle cx="76" cy="72" r="2.5" fill="var(--accent)" opacity="0.6" />
      <circle cx="124" cy="72" r="2.5" fill="var(--accent)" opacity="0.6" />
      {/* Connection lines */}
      <line x1="66" y1="68" x2="76" y2="72" stroke="var(--accent)" strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />
      <line x1="134" y1="68" x2="124" y2="72" stroke="var(--accent)" strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />
    </svg>
  );
}
