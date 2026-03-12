export function EmptyProducts({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Box body */}
      <path
        d="M50 65l50-25 50 25v55l-50 25-50-25V65z"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Box middle line */}
      <line x1="100" y1="40" x2="100" y2="120" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.3" />
      {/* Box top left flap */}
      <path d="M50 65l50-25 50 25-50 25-50-25z" stroke="var(--muted-foreground)" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Open flaps */}
      <path d="M50 65l20-30" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M150 65l-20-30" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      {/* Sparkle top */}
      <circle cx="100" cy="28" r="3.5" fill="var(--accent)" opacity="0.8" />
      <circle cx="115" cy="22" r="2" fill="var(--accent)" opacity="0.5" />
      <circle cx="88" cy="24" r="1.5" fill="var(--accent)" opacity="0.4" />
    </svg>
  );
}
