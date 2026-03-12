export function EmptySearch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Magnifying glass circle */}
      <circle
        cx="90"
        cy="70"
        r="35"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Glass inner */}
      <circle cx="90" cy="70" r="25" stroke="var(--muted-foreground)" strokeWidth="1" opacity="0.2" fill="none" />
      {/* Handle */}
      <line
        x1="117"
        y1="97"
        x2="148"
        y2="128"
        stroke="var(--muted-foreground)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Question mark */}
      <path
        d="M83 60c0-6.6 3.1-10 7-10s7 3.4 7 7c0 4-3.5 5-7 7"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />
      <circle cx="90" cy="78" r="1.5" fill="var(--muted-foreground)" opacity="0.4" />
      {/* Sparkle */}
      <circle cx="55" cy="40" r="3" fill="var(--accent)" opacity="0.7" />
      <circle cx="130" cy="50" r="2" fill="var(--accent)" opacity="0.5" />
    </svg>
  );
}
