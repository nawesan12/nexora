export function EmptyFinance({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Wallet body */}
      <rect
        x="40"
        y="50"
        width="100"
        height="70"
        rx="10"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Wallet flap */}
      <path
        d="M40 65h100"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        opacity="0.3"
      />
      {/* Wallet clasp */}
      <rect
        x="115"
        y="78"
        width="30"
        height="16"
        rx="8"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.6"
      />
      <circle cx="130" cy="86" r="3" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.5" />
      {/* Floating coin 1 */}
      <circle cx="155" cy="42" r="10" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7" fill="var(--accent)" fillOpacity="0.1" />
      <text x="155" y="46" textAnchor="middle" fontSize="10" fill="var(--accent)" opacity="0.7" fontWeight="600">$</text>
      {/* Floating coin 2 */}
      <circle cx="165" cy="62" r="7" stroke="var(--accent)" strokeWidth="1.5" opacity="0.4" fill="var(--accent)" fillOpacity="0.05" />
      <text x="165" y="65" textAnchor="middle" fontSize="7" fill="var(--accent)" opacity="0.4" fontWeight="600">$</text>
      {/* Floating coin 3 */}
      <circle cx="148" cy="28" r="5" stroke="var(--accent)" strokeWidth="1" opacity="0.3" fill="var(--accent)" fillOpacity="0.05" />
    </svg>
  );
}
