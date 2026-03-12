export function EmptyEmployees({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Badge body */}
      <rect
        x="55"
        y="25"
        width="90"
        height="110"
        rx="10"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Badge clip */}
      <rect x="88" y="18" width="24" height="14" rx="4" stroke="var(--muted-foreground)" strokeWidth="1.5" fill="var(--muted)" fillOpacity="0.6" />
      <line x1="100" y1="18" x2="100" y2="10" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Person circle */}
      <circle cx="100" cy="65" r="16" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.5" fill="var(--muted)" fillOpacity="0.3" />
      {/* Person head */}
      <circle cx="100" cy="60" r="8" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.4" fill="none" />
      {/* Person body */}
      <path d="M88 78c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" fill="none" />
      {/* Name line */}
      <line x1="78" y1="100" x2="122" y2="100" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      {/* Role line */}
      <line x1="85" y1="112" x2="115" y2="112" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      {/* Sparkle */}
      <circle cx="150" cy="30" r="3" fill="var(--accent)" opacity="0.8" />
      <circle cx="158" cy="42" r="2" fill="var(--accent)" opacity="0.5" />
    </svg>
  );
}
