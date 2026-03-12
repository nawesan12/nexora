export function EmptyTransfers({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left box */}
      <rect
        x="25"
        y="50"
        width="50"
        height="50"
        rx="6"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Left box flap */}
      <path
        d="M25 56l25-10 25 10"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Left box inner lines */}
      <line
        x1="38"
        y1="70"
        x2="62"
        y2="70"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        opacity="0.3"
      />
      <line
        x1="42"
        y1="80"
        x2="58"
        y2="80"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        opacity="0.2"
      />
      {/* Right box */}
      <rect
        x="125"
        y="50"
        width="50"
        height="50"
        rx="6"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Right box flap */}
      <path
        d="M125 56l25-10 25 10"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Right box inner lines */}
      <line
        x1="138"
        y1="70"
        x2="162"
        y2="70"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        opacity="0.3"
      />
      <line
        x1="142"
        y1="80"
        x2="158"
        y2="80"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        opacity="0.2"
      />
      {/* Arrow from left to right */}
      <line
        x1="82"
        y1="68"
        x2="116"
        y2="68"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M112 63l6 5-6 5"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
      {/* Arrow from right to left */}
      <line
        x1="118"
        y1="82"
        x2="84"
        y2="82"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M88 77l-6 5 6 5"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />
      {/* Sparkle */}
      <circle cx="160" cy="40" r="3" fill="var(--primary)" opacity="0.8" />
      <circle cx="170" cy="48" r="2" fill="var(--primary)" opacity="0.5" />
    </svg>
  );
}
