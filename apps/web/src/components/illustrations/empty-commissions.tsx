export function EmptyCommissions({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Percentage badge */}
      <rect
        x="60"
        y="35"
        width="80"
        height="55"
        rx="12"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      <text
        x="100"
        y="70"
        textAnchor="middle"
        fontSize="24"
        fill="var(--muted-foreground)"
        opacity="0.4"
        fontWeight="600"
      >
        %
      </text>
      {/* Coin stack */}
      <ellipse cx="100" cy="115" rx="30" ry="8" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.3" fill="var(--muted)" fillOpacity="0.3" />
      <ellipse cx="100" cy="108" rx="30" ry="8" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.25" fill="var(--muted)" fillOpacity="0.25" />
      <ellipse cx="100" cy="101" rx="30" ry="8" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.2" fill="var(--muted)" fillOpacity="0.2" />
      {/* Floating coins */}
      <circle cx="152" cy="40" r="8" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" fill="var(--accent)" fillOpacity="0.1" />
      <text x="152" y="44" textAnchor="middle" fontSize="8" fill="var(--accent)" opacity="0.6" fontWeight="600">$</text>
      <circle cx="48" cy="50" r="6" stroke="var(--accent)" strokeWidth="1" opacity="0.4" fill="var(--accent)" fillOpacity="0.05" />
      <text x="48" y="53" textAnchor="middle" fontSize="6" fill="var(--accent)" opacity="0.4" fontWeight="600">$</text>
    </svg>
  );
}
