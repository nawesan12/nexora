export function EmptyGeneric({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Folder body */}
      <rect
        x="40"
        y="50"
        width="120"
        height="80"
        rx="8"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Folder tab */}
      <path
        d="M40 58V46a6 6 0 016-6h30l8 10h70a6 6 0 016 6v2"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner line 1 */}
      <line
        x1="65"
        y1="80"
        x2="135"
        y2="80"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Inner line 2 */}
      <line
        x1="75"
        y1="95"
        x2="125"
        y2="95"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
      />
      {/* Sparkle */}
      <circle cx="152" cy="42" r="3" fill="var(--accent)" opacity="0.8" />
      <circle cx="162" cy="52" r="2" fill="var(--accent)" opacity="0.5" />
    </svg>
  );
}
